// join-onboarding-course.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildRequestBody, parseArgs } = require('./join-onboarding-course.js');

test('parseArgs extracts name/email/flag correctly', () => {
  const args = parseArgs(['Rob', 'Lee', 'rob@example.com', '--existing-client']);
  assert.deepStrictEqual(args, { firstName: 'Rob', lastName: 'Lee', email: 'rob@example.com', isExistingClient: true });
});

test('parseArgs defaults isExistingClient to false', () => {
  const args = parseArgs(['Rob', 'Lee', 'rob@example.com']);
  assert.strictEqual(args.isExistingClient, false);
});

test('buildRequestBody never shell-interpolates — returns a plain object, not a string', () => {
  const body = buildRequestBody({ firstName: 'O\'Brien', lastName: 'Test', email: 'a"b@example.com', isExistingClient: false });
  assert.strictEqual(typeof body, 'object');
  assert.strictEqual(body.firstName, "O'Brien");
  assert.strictEqual(body.email, 'a"b@example.com');
});

test('parseArgs treats --existing-client as positional-independent (works anywhere in argv)', () => {
  const args = parseArgs(['--existing-client', 'Rob', 'Lee', 'rob@example.com']);
  assert.deepStrictEqual(args, { firstName: 'Rob', lastName: 'Lee', email: 'rob@example.com', isExistingClient: true });
});

test('buildRequestBody passes backticks and semicolons through as plain object values', () => {
  const body = buildRequestBody({ firstName: 'Rob`whoami`', lastName: 'Lee;rm -rf /', email: 'a;b`c@example.com', isExistingClient: false });
  assert.strictEqual(typeof body, 'object');
  assert.strictEqual(body.firstName, 'Rob`whoami`');
  assert.strictEqual(body.lastName, 'Lee;rm -rf /');
  assert.strictEqual(body.email, 'a;b`c@example.com');
});

test('main prints usage and exits non-zero when email is missing, without throwing', async () => {
  const { main } = require('./join-onboarding-course.js');
  const originalArgv = process.argv;
  const originalExit = process.exit;
  const originalError = console.error;
  let exitCode;
  let errorOutput = '';
  process.exit = (code) => { exitCode = code; throw new Error('__exit__'); };
  console.error = (msg) => { errorOutput += msg; };
  process.argv = ['node', 'join-onboarding-course.js', 'Rob'];
  try {
    await main();
  } catch (err) {
    if (err.message !== '__exit__') throw err;
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.error = originalError;
  }
  assert.strictEqual(exitCode, 1);
  assert.match(errorOutput, /Usage: node join-onboarding-course\.js/);
});

test('main prints the friendly non-OK message and does not throw or exit non-zero when the Worker responds with a bad status', async () => {
  const { main } = require('./join-onboarding-course.js');
  const originalArgv = process.argv;
  const originalFetch = global.fetch;
  const originalLog = console.log;
  const originalExit = process.exit;
  let logOutput = '';
  let exitCalled = false;
  global.fetch = async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' });
  console.log = (msg) => { logOutput += msg; };
  process.exit = () => { exitCalled = true; };
  process.argv = ['node', 'join-onboarding-course.js', 'Rob', 'Lee', 'rob@example.com'];
  try {
    await main();
  } finally {
    process.argv = originalArgv;
    global.fetch = originalFetch;
    console.log = originalLog;
    process.exit = originalExit;
  }
  assert.match(logOutput, /Signup didn't go through right now/);
  assert.strictEqual(exitCalled, false);
});
