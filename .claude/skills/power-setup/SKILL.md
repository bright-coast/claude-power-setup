---
name: power-setup
description: Adaptive onboarding interview that configures Claude Code for a new user, CLAUDE.md, memory, permission mode, mail/messaging connectors, and dev tooling, tailored to who they are. Use when the user says "run the setup" or "set up Claude Code for me".
---

# Claude Power Setup

Conduct this as a real conversation using AskUserQuestion, one question at a time. Write progress to `.power-setup-state.json` in the current directory after each step, so a restart resumes instead of starting over.

## Step 1: Environment sanity check (automatic, no question asked)

Run, in order, stopping to help fix any failure before continuing:
1. `claude --version`. If this fails, Claude Code itself isn't correctly installed; stop and point the user to https://code.claude.com/docs/en/setup.
2. Check whether the current working directory path contains `OneDrive`, `iCloud Drive`, or `Dropbox` (see `rules/environment-checks.md` for why this matters). If it does, tell the user plainly and recommend moving to a folder near their home directory before continuing.
3. On Windows only, confirm `.local\bin` is in PATH (`echo $env:PATH` in PowerShell, or `echo $PATH` in Git Bash). If missing, walk them through `rules/environment-checks.md`'s fix.

## Step 2: Existing client check

Ask: "Are you already working with Rob Lee / Bright Coast AI (for example, already paying for the AI Chief of Staff)?"

- If **yes**: set `isExistingClient = true` in the state file. Skip Step 3 entirely. Continue to Step 4.
- If **no**: set `isExistingClient = false`. Continue to Step 3.

## Step 3: Name + email (skipped if isExistingClient is true)

Ask: "What's your name and email? This lets me tailor the rest of this, and adds you to a short email course on getting the most out of your setup; Rob can also follow up if you want a hand. Totally optional, just say skip if you'd rather not."

If provided, store `firstName`, `lastName`, `email` in the state file. These get sent in Task 8's signup script at the very end of the interview, not immediately (so a user who abandons partway through never gets signed up on a partial answer).

## Step 4: Work / personal / both

Ask: "Is this mainly for work, personal use, or both?" Store the answer as `usageContext`.

## Step 5: Technical comfort → persona tier

Ask, in plain language, never naming a specific tool: "Do you expect to have a lot of different projects going where you'd want Claude to remember details across all of them, or is this more for one thing at a time?" Follow up if the answer is ambiguous: "Have you used a command line / terminal before?"

Bucket into a `personaTier` stored in the state file:
- **minimal**: personal-only, low technical comfort. CLAUDE.md + memory only, no connectors, defaults to `plan` mode.
- **solo-business**: work or both, moderate comfort. Adds mail connector, defaults to `acceptEdits`.
- **technical**: high comfort / has used a terminal. Adds dev CLI tooling, mentions `claude-automation-recommender`, comfortable with `auto` mode if they confirm they understand the tradeoff.
- **everything**: offered explicitly as a fourth option alongside the three above. "Or, want the full setup, all of it?"
