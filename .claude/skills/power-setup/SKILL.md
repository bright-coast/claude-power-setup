---
name: power-setup
description: Adaptive onboarding interview that configures Claude Code for a new user, CLAUDE.md, memory, permission mode, mail/messaging connectors, and dev tooling, tailored to who they are. Use when the user says "run the setup" or "set up Claude Code for me".
---

# Claude Power Setup

Conduct this as a real conversation using AskUserQuestion, one question at a time. This repo is the user's new Claude Code home base: once they've cloned it into place, this interview writes everything (the state file, the generated `CLAUDE.md`, settings) right here, in this repo, in place, not somewhere else. Write progress to `.power-setup-state.json` in the current directory after each step, so a restart resumes instead of starting over.

## Step 1: Environment sanity check (automatic, no question asked)

Run, in order, stopping to help fix any failure before continuing:
1. `claude --version`. If this fails, Claude Code itself isn't correctly installed; stop and point the user to https://code.claude.com/docs/en/setup.
2. Check whether the current working directory path contains `OneDrive`, `iCloud Drive`, or `Dropbox` (see `rules/environment-checks.md` for why this matters). If it does, tell the user plainly and recommend moving to a folder near their home directory before continuing.
3. On Windows only, confirm `.local\bin` is in PATH (`echo $env:PATH` in PowerShell, or `echo $PATH` in Git Bash). If missing, walk them through `rules/environment-checks.md`'s fix.

Also record the detected OS (`mac`, `windows`, or `linux`) as `os` in the state file. Step 8 uses it later to pick the right install commands.

## Step 2: Existing client check

Ask: "Are you already working with Rob Lee / Bright Coast AI (for example, already paying for the AI Chief of Staff)?"

- If **yes**: set `isExistingClient = true` in the state file.
- If **no**: set `isExistingClient = false` in the state file.

Continue to Step 3 either way. The question there is framed differently depending on the answer, but both branches now get asked.

## Step 3: Name + email

Still fully skippable, but the framing depends on `isExistingClient`:

- If `isExistingClient` is **false** (new prospect): Ask "What's your name and email? This lets me tailor the rest of this, and adds you to a short email course on getting the most out of your setup, unsubscribe anytime; Rob can also follow up if you want a hand. Totally optional, just say skip if you'd rather not."
- If `isExistingClient` is **true**: Ask "What's your name and email? This isn't for a mailing list, it just lets me let Rob know you ran through this, in case you want a hand. Totally optional, just say skip if you'd rather not."

If provided, store `firstName`, `lastName`, `email` in the state file. These get sent via `.claude/skills/power-setup/scripts/join-onboarding-course.js` at the very end of the interview (Step 11), not immediately, so a user who abandons partway through never gets signed up on a partial answer.

## Step 4: Work / personal / both

Ask: "Is this mainly for work, personal use, or both?" Store the answer as `usageContext`.

## Step 5: Technical comfort → persona tier

Ask, in plain language, never naming a specific tool: "Do you expect to have a lot of different projects going where you'd want Claude to remember details across all of them, or is this more for one thing at a time?" Follow up if the answer is ambiguous: "Have you used a command line / terminal before?"

Bucket into a `personaTier` stored in the state file:
- **minimal**: personal-only, low technical comfort. CLAUDE.md + memory only, no connectors, defaults to `plan` mode.
- **solo-business**: work or both, moderate comfort. Adds mail connector, defaults to `acceptEdits`.
- **technical**: high comfort / has used a terminal. Adds dev CLI tooling, mentions `claude-automation-recommender`, comfortable with `auto` mode if they confirm they understand the tradeoff.
- **everything**: offered explicitly as a fourth option alongside the three above. "Or, want the full setup, all of it?"

If the usage-context signal (Step 4) and the comfort signal (Step 5) point toward different tiers, for example work usage paired with no command-line experience, round down to the more cautious tier rather than up. Never over-provision connectors or tooling off an ambiguous answer.

## Step 6: Mail providers

Ask which mail provider(s) they use: Gmail, Outlook, Apple Mail (Mac only), or other/IMAP. Skip entirely if `personaTier` is `minimal` and they said "personal" with no mention of needing email access.

- **Gmail**: offer the choice between `@marlinjai/email-mcp` (near-zero setup, it ships a pre-registered OAuth app, no Google Cloud Console step) and a full custom Google API integration (more setup, more control). Default recommendation: `@marlinjai/email-mcp` unless `personaTier` is `technical`. If they go with it, actually run the setup rather than just describing it: execute `npx @marlinjai/email-mcp setup` and let its own interactive wizard walk the user through picking a provider and authenticating. Don't try to reimplement that wizard yourself.
- **Outlook**: covered by the same `@marlinjai/email-mcp` wizard as Gmail, no meaningfully different setup: it uses a built-in OAuth/PKCE flow, so no Azure app registration is needed for the default path. If they proceed, run the same command as Gmail, `npx @marlinjai/email-mcp setup`, and pick Outlook when its wizard asks. Only mention Azure app registration as an optional aside, for someone who specifically wants their own OAuth app instead of the built-in one.
- **Apple Mail** (only if they're on a Mac): recommend `apple-mail-mcp` (by sweetrb), local AppleScript, no credentials needed at all. There's no single confirmed one-line install for this one, so don't guess a command. First run `claude mcp list` to check whether it's already configured. If it isn't, look up the package's actual install instructions before doing anything, for example `npm view apple-mail-mcp` for the current version and repo link, or its README at the linked GitHub repo, then add it with `claude mcp add` using whatever invocation that lookup actually confirms.
- **Other/IMAP**: note they'll need an app-specific password from their provider's security settings (not their real account password), and point to `imap-mcp-server` (by nikolausm). Same approach as Apple Mail: check `claude mcp list` first, then look up the real install command with `npm view imap-mcp-server` or its README rather than guessing, then add it with `claude mcp add`.

If they mention wanting a *hosted* option like Nylas, explicitly tell them: "that routes your mail through a third party's servers, not just Google's/Microsoft's directly; worth knowing before you connect it." Never set this one up automatically; it's a warning, not a default action.

## Step 7: Messaging connectors

Only ask if `usageContext` included "personal" or "both": "Want Claude to be able to read/draft WhatsApp or SMS messages too? This is more of a personal-use thing; most people skip this for work-only setups." Skip asking entirely if `usageContext` was "work" only.

If they say yes: no specific WhatsApp/SMS package is named here, because none has been confirmed reliable enough to hardcode. Use WebSearch to find a current, well-regarded MCP server for this (something like "WhatsApp MCP server Claude Code" or "SMS MCP server" is a reasonable query). Before suggesting anything found this way, verify it's real rather than a hallucinated or abandoned package: check it has an actual npm listing or GitHub repo with documentation and a sane release history, not just a forum mention. Show the user what was found, what it does, and what setup involves, and only run `claude mcp add` if they confirm they want it installed. If nothing trustworthy turns up, say so plainly rather than installing something shaky.

## Step 8: Developer/deploy tooling

Only ask if `personaTier` is `technical` or `everything`: "Do you build or deploy things, like websites, apps, or infrastructure?" If yes, offer `gcloud` CLI (Google Cloud), Cloudflare `wrangler` CLI, and GitHub CLI (`gh`). For each one they want, actually check and install it rather than just describing it:

1. Check whether it's already installed: `gcloud --version`, `wrangler --version` (or `npx wrangler --version` if it's not on PATH), and `gh --version`.
2. For anything missing, install it using the command for the `os` recorded in Step 1:

| Tool | macOS | Windows | Linux |
|---|---|---|---|
| gcloud | `brew install --cask google-cloud-sdk` | no clean one-liner; point them to https://cloud.google.com/sdk/docs/install | `curl https://sdk.cloud.google.com \| bash` |
| wrangler | `npm install -g wrangler` | `npm install -g wrangler` | `npm install -g wrangler` |
| gh | `brew install gh` | `winget install --id GitHub.cli` | varies by distro; point them to https://github.com/cli/cli#installation |

The Claude CLI itself was already confirmed current in Step 1's `claude --version` check; just reference that here, no need to re-run it.

## Step 9: Permission mode

Explain the table in `rules/permission-modes.md` in the user's own words, not just pasting it. Recommend based on `personaTier`:
- `minimal` / `solo-business`: recommend `plan` to start, `acceptEdits` once comfortable.
- `technical` / `everything`: mention `auto` is available, but only recommend it if they explicitly say they understand what it does. Never default to it silently.

Never recommend `bypassPermissions` under any circumstance in this flow.

Once a mode is agreed, actually set it rather than just explaining it. Read `.claude/settings.json` at the repo root if it already exists, and merge in `{"permissions": {"defaultMode": "<mode>"}}` alongside whatever else is already in that file; don't clobber unrelated keys. If the file doesn't exist yet, create it with just that key.

Never write `"bypassPermissions"` as the value, full stop, no exceptions. This is the same rule as "never recommend it" above, just applied to the actual write, not just the recommendation. `"auto"` is the only mode that's conditionally writable: only write it if the user is in the `technical`/`everything` tier and has explicitly confirmed they understand the tradeoff. If they haven't confirmed, write the more cautious mode (`plan` or `acceptEdits`) instead and mention they can change it later.

Claude Code can decline to edit its own permission settings mid-session. If that write is refused, don't paper over it as if it succeeded: print the exact `{"permissions": {"defaultMode": "<mode>"}}` block for the user to paste into `.claude/settings.json` themselves, or point them to `/config`, and say plainly that the mode wasn't applied automatically.

## Step 10: Generate CLAUDE.md

Before writing anything, check the `CLAUDE.md` already sitting at the repo root: if it no longer contains the `{{...}}` placeholders, this setup already ran here before. Tell the user plainly that it looks like the setup already ran, and confirm before overwriting their personalized file.

Fill in `CLAUDE.md` in place at the repo root, replacing `{{PROJECT_OR_PERSON_NAME}}` and `{{ONE_LINE_FROM_INTERVIEW}}` with the interview answers directly. Don't copy it anywhere else: `rules/` lives right next to it, and the `@rules/...` imports below only resolve correctly relative to this file's own location. Always import `rules/permission-modes.md` and `rules/memory.md` (memory applies at every persona tier, per Step 5), and add any other rule file relevant only to what they actually opted into (don't import a mail-provider rule file if they skipped Step 6, etc.). If no name was ever collected (the user skipped Step 3), fall back to the repo folder's name rather than inventing a person's name. Apply the same litmus test when writing anything new: would removing this line cause Claude to make a mistake? If not, don't write it.

## Step 11: Closing CTA

The signup script in this repo's scripts folder is `.claude/skills/power-setup/scripts/join-onboarding-course.js`, run from the repo root:

- If `isExistingClient` is **false** and `email` was provided in Step 3: run `node .claude/skills/power-setup/scripts/join-onboarding-course.js <firstName> <lastName> <email>`.
- If `isExistingClient` is **true** and `email` was provided in Step 3: run `node .claude/skills/power-setup/scripts/join-onboarding-course.js <firstName> <lastName> <email> --existing-client`. This is what lets Rob know an existing client ran through the setup, kept separate from the marketing list.
- If `isExistingClient` is **true** and email was declined: don't run the script. Show: "Since you're already working with Rob, the best next step for a 1:1 walkthrough is booking through your portal: https://app.brightcoast.ai/dashboard/portal?tab=schedule"
- If `isExistingClient` is **false** and email was declined: don't run the script. Show: "If you'd like a hand getting this exactly right, Rob runs a two-hour 1:1 setup session: https://book.brightcoast.ai/rob-lee/setup"
