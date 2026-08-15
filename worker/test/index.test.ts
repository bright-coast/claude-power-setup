// worker/test/index.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index';

const VALID_BODY = { firstName: 'Test', lastName: 'User', email: 'test@example.com', isExistingClient: false };

function makeEnv(overrides = {}) {
  const store = new Map<string, string>();
  return {
    WEBHOOK_SECRET: 'test-secret',
    RATE_LIMIT_KV: {
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: string, opts?: any) => { store.set(key, value); },
    },
    ...overrides,
  };
}

describe('signup worker', () => {
  it('rejects non-POST methods', async () => {
    const env = makeEnv();
    const req = new Request('https://signup.brightcoast.ai', { method: 'GET' });
    const res = await worker.fetch(req, env as any);
    expect(res.status).toBe(405);
  });

  it('rejects a request missing email', async () => {
    const env = makeEnv();
    const req = new Request('https://signup.brightcoast.ai', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await worker.fetch(req, env as any);
    expect(res.status).toBe(400);
  });

  it('rejects a request with an invalid email format', async () => {
    const env = makeEnv();
    const req = new Request('https://signup.brightcoast.ai', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_BODY, email: 'not-an-email' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await worker.fetch(req, env as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'email looks invalid' });
  });

  it('forwards a signed request to FunnelPort and returns ok on success', async () => {
    const env = makeEnv();
    global.fetch = vi.fn(async (url, init: any) => {
      expect(url).toBe('https://funnel.brightcoast.ai/api/webhook/claude-power-setup');
      expect(init.headers['X-Webhook-Signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
      return new Response(JSON.stringify({ ok: true }), { status: 202 });
    }) as any;

    const req = new Request('https://signup.brightcoast.ai', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await worker.fetch(req, env as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('rate-limits after 5 requests from the same IP within the window', async () => {
    const env = makeEnv();
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 202 })) as any;
    const makeReq = () => new Request('https://signup.brightcoast.ai', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
    });

    for (let i = 0; i < 5; i++) {
      const res = await worker.fetch(makeReq(), env as any);
      expect(res.status).toBe(200);
    }
    const sixth = await worker.fetch(makeReq(), env as any);
    expect(sixth.status).toBe(429);
  });

  it('fails open and forwards the request when KV throws', async () => {
    const env = makeEnv({
      RATE_LIMIT_KV: {
        get: async () => { throw new Error('KV unavailable'); },
        put: async () => { throw new Error('KV unavailable'); },
      },
    });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 202 })) as any;

    const req = new Request('https://signup.brightcoast.ai', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await worker.fetch(req, env as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalled();
  });
});
