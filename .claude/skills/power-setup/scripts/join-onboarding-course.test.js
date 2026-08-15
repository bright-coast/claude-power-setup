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
