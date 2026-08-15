// worker/src/index.ts
export interface Env {
  WEBHOOK_SECRET: string;
  RATE_LIMIT_KV: KVNamespace;
}

const FUNNELPORT_URL = 'https://funnel.brightcoast.ai/api/webhook/claude-power-setup';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(sigBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const current = parseInt((await kv.get(key)) ?? '0', 10);
  if (current >= RATE_LIMIT_MAX) return false;
  await kv.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  return true;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(env.RATE_LIMIT_KV, ip);
    if (!allowed) {
      return Response.json({ error: 'Too many requests, try again in a minute' }, { status: 429 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { firstName, lastName, email, isExistingClient } = payload;
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const forwardBody = JSON.stringify({ email, firstName, lastName, isExistingClient: !!isExistingClient });
    const signature = 'sha256=' + await hmacSha256Hex(env.WEBHOOK_SECRET, forwardBody);

    const upstream = await fetch(FUNNELPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signature },
      body: forwardBody,
    });

    if (!upstream.ok) {
      return Response.json({ error: 'Signup failed, please try again' }, { status: 502 });
    }

    return Response.json({ ok: true }, { status: 200 });
  },
};
