---
name: power-setup
description: Adaptive onboarding interview that configures Claude Code for a new user, CLAUDE.md, memory, permission mode, mail/messaging connectors, and dev tooling, tailored to who they are. Use when the user says "run the setup" or "set up Claude Code for me".
---

# Claude Power Setup

Conduct this as a real conversation using AskUserQuestion, one question at a time. This repo is the user's new Claude Code home base: once they've cloned it into place, this interview writes everything (the state file, the generated `CLAUDE.md`, settings) right here, in this repo, in place, not somewhere else. Write progress to `.power-setup-state.json` in the current directory after each step, so a restart resumes instead of starting over.

## Step 0: Bootstrap (automatic, no question asked unless a clone is needed)

Before anything else, check whether this repo is already present locally: does `rules/environment-checks.md` exist relative to the current working directory?

- If it exists, this is already a local clone. Skip straight to Step 1, no cloning needed.
- If it doesn't exist, this instruction was pasted into a Claude Code session that doesn't have this repo yet. Tell the user plainly what's about to happen: this is the Claude Power Setup interview, and it needs its own repo on disk before the rest of the interview can run. Then:
  1. Ask where to clone it, suggesting a sensible default: `~/claude-power-setup`, a home-directory-relative path that works the same way on macOS, Windows, and Linux. Let them just accept the default rather than typing a path.
  2. Before cloning, apply the same guard the rest of this product uses against cloud-synced folders. `rules/environment-checks.md` can't be `@`-imported yet at this point, since it doesn't exist locally, so state the check inline here: if the chosen path contains `OneDrive`, `iCloud Drive`, or `Dropbox`, warn the user and suggest a different location instead of cloning there.
  3. Run `git clone https://github.com/bright-coast/claude-power-setup.git <chosen-path>`. If `git` isn't available, tell the user plainly that git is required for this path, and suggest downloading the repo as a zip from GitHub and extracting it manually instead, then re-running "run the setup" from inside the extracted folder. Don't build a more elaborate fallback than that; it isn't worth the complexity for how rare it'll be.
  4. Handle the clone's actual result before continuing; don't assume it worked:
     - If it fails specifically because `<chosen-path>` already exists and isn't empty, that alone doesn't prove it's a real prior clone of this repo, so verify before trusting it: check whether `rules/environment-checks.md` exists inside `<chosen-path>`, the same check this step used at the very top. If it does, this genuinely is an existing clone: tell the user that, and continue the rest of the interview from that path per item 5 below. If it doesn't, the directory just has unrelated content in it; tell the user that plainly, ask for a different path, and go back to asking where to clone it (item 1 above). Don't proceed as if it were already cloned.
     - If it fails for any other reason (repo not found or private, network error, an auth prompt that would hang, etc.), show the user the actual error output and stop. Don't continue the interview as if the clone had succeeded.
     - If it succeeds outright, continue as normal.
  5. Once cloned, or confirmed already there per the step above, continue the rest of this interview using paths relative to the newly-cloned directory from this point forward, exactly as if the user had cloned it manually per the README. State this plainly so it's clear the working directory has effectively changed: every relative path referenced later in this file, `rules/...`, `.power-setup-state.json`, `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/power-setup/scripts/...`, now resolves inside `<chosen-path>`, not wherever this was originally pasted.

## Step 1: Environment sanity check (automatic, no question asked)

Run, in order, stopping to help fix any failure before continuing:
1. `claude --version`. If this fails, Claude Code itself isn't correctly installed; stop and point the user to https://code.claude.com/docs/en/setup.
2. Check whether the current working directory path contains `OneDrive`, `iCloud Drive`, or `Dropbox` (see `rules/environment-checks.md` for why this matters). If Step 0 resolved to a path other than where this was originally pasted, whether by cloning or by confirming an existing clone already there, apply this check to that resolved path, not the original paste location; Claude Code can't actually change the OS-level working directory mid-session, so "current working directory" here means wherever the interview is now treating as its base. If it does contain one of those, tell the user plainly and recommend moving to a folder near their home directory before continuing.
3. On Windows only, confirm `.local\bin` is in PATH (`echo $env:PATH` in PowerShell, or `echo $PATH` in Git Bash). If missing, walk them through `rules/environment-checks.md`'s fix.

Also record the detected OS (`mac`, `windows`, or `linux`) as `os` in the state file. Step 8 uses it later to pick the right install commands.

## Step 1.5: New setup or review?

Ask: "Are you setting up a new Claude Code configuration, or would you like me to review your existing one?"

- If **review**: set `mode = "review"` in the state file and continue to Step 2 exactly as the interview already works today. The existing-client check, name/email, work/personal/both, and persona-tier steps are genuinely useful for review mode too, they calibrate how much detail to give and still serve the lead-capture/client-touch purpose either way. Step 5 sends a review-mode session on to the Review Mode section at the end of this file instead of Step 6.
- If **setup** (or the user doesn't distinguish; setup is the sensible default for anyone without a strong opinion): set `mode = "setup"` in the state file and continue to Step 2 exactly as the interview already works today.

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

Once `personaTier` is set, check `mode`. If `mode` is `review`, skip ahead to the Review Mode section at the end of this file and continue from R1 there. Otherwise, continue to Step 6 exactly as today.

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

Before writing anything, check the `CLAUDE.md` already sitting at the repo root: if the file is missing, or no longer contains any of the three `{{...}}` placeholders (`{{PROJECT_OR_PERSON_NAME}}`, `{{ONE_LINE_FROM_INTERVIEW}}`, `{{ADDITIONAL_RULE_IMPORTS_BASED_ON_INTERVIEW_ANSWERS}}`), treat that as this setup already having run here before. Tell the user plainly that it looks like the setup already ran, and confirm before overwriting their personalized file. If the file is missing entirely, say so explicitly rather than silently treating it as "already run"; ask the user how they'd like to proceed.

Fill in `CLAUDE.md` in place at the repo root, replacing all three placeholders: `{{PROJECT_OR_PERSON_NAME}}` and `{{ONE_LINE_FROM_INTERVIEW}}` with the interview answers directly, and `{{ADDITIONAL_RULE_IMPORTS_BASED_ON_INTERVIEW_ANSWERS}}` with the actual `@rules/...` import lines this user opted into (or remove the line entirely if there are none beyond the two always-imported ones below). Leaving any placeholder behind breaks the already-ran check on a future run. Don't copy it anywhere else: `rules/` lives right next to it, and the `@rules/...` imports below only resolve correctly relative to this file's own location. Always import `rules/permission-modes.md` and `rules/memory.md` (memory applies at every persona tier, per Step 5), and add any other rule file relevant only to what they actually opted into (don't import a mail-provider rule file if they skipped Step 6, etc.). If no name was ever collected (the user skipped Step 3), fall back to the repo folder's name rather than inventing a person's name. Apply the same litmus test when writing anything new: would removing this line cause Claude to make a mistake? If not, don't write it.

## Step 11: Closing CTA

The signup script in this repo's scripts folder is `.claude/skills/power-setup/scripts/join-onboarding-course.js`, run from the repo root:

- If `isExistingClient` is **false** and `email` was provided in Step 3: run `node .claude/skills/power-setup/scripts/join-onboarding-course.js <firstName> <lastName> <email>`.
- If `isExistingClient` is **true** and `email` was provided in Step 3: run `node .claude/skills/power-setup/scripts/join-onboarding-course.js <firstName> <lastName> <email> --existing-client`. This is what lets Rob know an existing client ran through the setup, kept separate from the marketing list.
- If `isExistingClient` is **true** and email was declined: don't run the script. Show: "Since you're already working with Rob, the best next step for a 1:1 walkthrough is booking through your portal: https://app.brightcoast.ai/dashboard/portal?tab=schedule"
- If `isExistingClient` is **false** and email was declined: don't run the script. Show: "If you'd like a hand getting this exactly right, Rob runs a two-hour 1:1 setup session: https://book.brightcoast.ai/rob-lee/setup"

## Review Mode

These steps only run when `mode` is `review` (set in Step 1.5, reached here from the end of Step 5). They exist for someone who already has some Claude Code setup and wants an audit of it, not a fresh build. The rule for every step below is the same one this whole product is built on: never assume a file or setting exists or doesn't, check the real state first, report what's actually there, then ask before changing anything. Never silently modify a file that isn't part of this repo's own template.

### R1: Confirm scope

Ask: "Want me to review this project's setup, your global `~/.claude` setup, or both?" Don't assume. This repo, wherever Step 0 resolved it to, is Claude Power Setup's own home base, not the project the user actually wants reviewed; those are different directories by this product's own design. "This project" means the directory the interview was originally pasted into, before Step 0 potentially redirected anything elsewhere, the same "original paste location" Step 1's cloud-sync guard already tracks.

Store the answer as `reviewScope` (`project`, `global`, or `both`) in the state file. When `project` or `both` is chosen, also store `reviewProjectPath` as that original paste location. R2 through R6 run once for each location in scope; when `reviewScope` is `both`, run each of them against the project location and the global location in turn, and keep the findings separated by location in R7's summary so it's clear which fix applies where.

### R2: Audit CLAUDE.md

For each location in scope, check whether a `CLAUDE.md` exists there (the project root for `project` scope, `~/.claude/CLAUDE.md` for `global` scope). If it exists, read it and assess it against the same litmus test Step 10 already uses for writing one: would removing this line cause Claude to make a mistake? If not, it shouldn't be there. Also note general bloat, repeated content, or a length that's grown past what a skimmable file needs. If it doesn't exist at a location that's in scope, note that plainly as missing rather than skipping past it. Report findings only; nothing gets changed here, that happens in R7 and only after the user agrees to it.

### R3: Audit memory

Check whether their `CLAUDE.md` (or a rules file it imports) already describes a memory practice, the same kind of thing `rules/memory.md` in this repo does: a persistent, file-based memory of the user and their work that carries across sessions, not just within one conversation. If it's missing, note the gap, and describe what adding it would look like, using this repo's own `rules/memory.md` as the reference implementation R7 would actually copy in if they want it. Don't write anything yet.

### R4: Audit permission mode

Read `.claude/settings.json` at whichever location(s) are in scope per R1, the project's own `.claude/settings.json`, and/or the global `~/.claude/settings.json`. If it exists, report what `permissions.defaultMode` is currently set to. If it's `bypassPermissions`, flag that clearly as a real risk: per `rules/permission-modes.md`, that mode runs everything with no safety checks at all and is meant for isolated containers, never a main machine. If it's unset, or set to a mode that looks reasonable given how they described their setup, say so and move on. Don't change anything here either; that's R7's job, only if they ask for it.

### R5: Audit connectors and tooling

Run `claude mcp list` and report what's actually configured, mail connectors or anything else. If `personaTier` is `technical` or `everything`, or `usageContext` suggests they build or deploy things, also check for `gcloud`, `wrangler`, and `gh` the same way Step 8 does (`gcloud --version`, `wrangler --version` or `npx wrangler --version` if it's not on PATH, `gh --version`). Purely informational at this stage; no installs or changes happen here.

### R6: Audit structure

Note whether they have any rules-file organization at all, a `rules/` folder or equivalent, versus everything sitting in one `CLAUDE.md`. Only flag this as worth fixing if the file's actual size makes it a real problem, for example a specific rule has become hard to find or the file's no longer skimmable in a few seconds. Don't recommend splitting a short, well-organized `CLAUDE.md` into multiple files just because modularizing is possible; that's a reflexive opinion, not a finding.

### R7: Summary and offers

Present the findings from R2 through R6 as one organized summary: what's solid, what's missing, what's worth reconsidering. For each real gap, ask if they'd like it fixed, one at a time or however feels natural in the conversation, don't dump every gap as a single wall of asks in one message.

If they say yes to something, actually do it, reusing this file's own existing real-action patterns rather than reinventing them:

- **Permission mode**: follow the same read-merge-write-with-fallback approach Step 9 already uses. Read the existing `settings.json` (project or global, whichever's in scope), merge in `{"permissions": {"defaultMode": "<mode>"}}` alongside whatever else is already there, don't clobber unrelated keys, and never write `bypassPermissions` under any circumstance. If the write gets refused, print the exact block for the user to paste in themselves, exactly as Step 9 does.
- **Adding memory**: follow the same copy-the-rules-file approach Step 10 uses when generating a fresh `CLAUDE.md`, adapted here to an existing file rather than a fresh template. If they already have an importable rules folder, add a new memory rules file there (matching this repo's own `rules/memory.md`) and merge in the import line. If they don't have anywhere to import from, write the same memory content directly into their `CLAUDE.md` instead of inventing a different practice.
- **CLAUDE.md gaps or bloat**: edit the file in place, explaining what's changing and why before writing it.

Never silently auto-fix everything at once. This step is a conversation, check, report, ask, then act, one gap at a time, not a batch script that rewrites someone's whole setup in a single pass.

### R8: Closing CTA

Follow Step 11's closing CTA logic above, exactly as already written there: existing client gets the portal link, new prospect who gave an email in Step 3 gets the signup script run, new prospect who didn't gets the booking link only. Don't repeat that logic here; there should only ever be one copy of it to keep correct.
