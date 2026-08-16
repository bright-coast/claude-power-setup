# Claude Power Setup

Claude Power Setup is an adaptive interview for [Claude Code](https://code.claude.com), built and given away by Bright Coast AI. It does two things: it configures a new Claude Code setup for you by asking a short series of plain-language questions about how you work, and it audits a setup you already have, telling you what's solid, what's missing, and what's worth fixing, then fixing it if you say yes. It isn't a document to read; it's an interview Claude conducts, and either way, nothing gets changed without asking first.

## Try it right now, no download

Paste this into any existing Claude Code session:

> Fetch https://raw.githubusercontent.com/bright-coast/claude-power-setup/main/.claude/skills/power-setup/SKILL.md and follow the instructions in it.

Claude reads the interview and, if it isn't already running from inside a local copy of this repo, clones one for you automatically before continuing, asking where first rather than assuming. From there it's the same interview either way.

## What this is

- A public, industry-agnostic onboarding and audit skill, not a plugin. You can run it straight from a pasted link or install it as a plain folder, whichever you'd rather.
- The interview itself lives at `.claude/skills/power-setup/SKILL.md`. Early on it asks whether you want a new setup or a review of your existing one, then branches by who you are: personal use, work, or both, and by your technical comfort, from a minimal setup with no connectors up to the full developer toolkit.
- Review mode reads your actual `CLAUDE.md`, permission settings, and connectors, wherever they really are, and reports back before touching anything. Nothing gets added or changed without you saying yes first.
- It writes its progress to a local state file as it goes, so if you close your terminal partway through, running the setup again picks up where you left off instead of starting over.
- Nothing in this repo runs outside your machine except one optional step at the very end of the interview: if you choose to share your name and email, a small script sends it to Bright Coast AI so you can be added to a short follow-up email course. That step is always opt-in and always announced before it happens.

## Install it locally instead

If you'd rather have a permanent local copy instead of pasting the link each time:

1. Clone or download this repository into a folder near your home directory, for example `~/claude-power-setup` or `C:\Users\<you>\claude-power-setup`.
2. Do not install it inside a folder synced by OneDrive, iCloud Drive, or Dropbox. That causes real, documented Claude Code crashes on both Windows and macOS. See `rules/environment-checks.md` for the full explanation and the fix if you've already run into it.
3. Open the folder in Claude Code.

## Run it

Once Claude Code is open in this folder, just say:

> run the setup

or, for a review of a setup you already have:

> review my Claude Code setup

Claude checks your environment first, then walks you through the interview one question at a time, tailoring your `CLAUDE.md` and configuration to your answers as it goes, or reporting back on what's already there.

## License

MIT licensed. See `LICENSE`. Use it, fork it, adapt it for your own team or clients.
