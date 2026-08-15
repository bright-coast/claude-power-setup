// join-onboarding-course.js
//
// Signs a new prospect up for the follow-up email course by POSTing to the
// Cloudflare Worker at SIGNUP_URL. Called from the onboarding interview's
// closing step (SKILL.md Step 11).
//
// Usage: node join-onboarding-course.js <firstName> <lastName> <email> [--existing-client]
//
// Security note: this script only ever sends user-supplied values as JSON
// via fetch(). It never builds a shell command string or shells out
// (no child_process.exec/execSync), so there is no command-injection
// surface even though firstName/lastName/email are fully user-controlled.
//
// Never throws an unhandled error and never exits non-zero except for bad
// usage; a signup hiccup should not look alarming to a user watching the
// interview run in their terminal.

const SIGNUP_URL = 'https://signup.brightcoast.ai/claude-power-setup';
const USAGE = 'Usage: node join-onboarding-course.js <firstName> <lastName> <email> [--existing-client]';

function parseArgs(argv) {
  const isExistingClient = argv.includes('--existing-client');
  const positional = argv.filter((a) => a !== '--existing-client');
  const [firstName, lastName, email] = positional;
  return { firstName, lastName, email, isExistingClient };
}

function buildRequestBody({ firstName, lastName, email, isExistingClient }) {
  return { firstName, lastName, email, isExistingClient };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.firstName || !args.lastName || !args.email) {
    console.error(USAGE);
    process.exit(1);
    return;
  }

  try {
    const res = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(args)),
    });
    if (res.ok) {
      console.log("You're signed up. Check your inbox shortly.");
    } else {
      console.log("Signup didn't go through right now, but everything else here still works fine.");
    }
  } catch {
    console.log("Couldn't reach the signup service, but everything else here still works fine.");
  }
}

if (require.main === module) {
  // Belt-and-braces: main() already catches its own fetch errors, but this
  // guards against any other unexpected failure surfacing as a raw stack
  // trace in front of a user watching the interview run.
  main().catch(() => {
    console.log("Couldn't complete signup, but everything else here still works fine.");
  });
}

module.exports = { parseArgs, buildRequestBody, main };
