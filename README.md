# Claude Power Setup

Claude Power Setup is an adaptive onboarding interview for [Claude Code](https://code.claude.com), built and given away by Bright Coast AI. Instead of reading a wall of setup documentation, you drop this folder into place, tell Claude to run the setup, and it asks you a short series of plain-language questions about how you work. From your answers it configures a starter `CLAUDE.md`, memory conventions, the permission mode that matches your comfort level, and, if you want them, mail and messaging connectors and developer tooling. It isn't a document to read; it's an interview Claude conducts, and the setup it produces is tailored to you rather than a generic default.

## What this is

- A public, industry-agnostic onboarding skill, not a plugin. You install it as a plain folder.
- The interview itself lives at `.claude/skills/power-setup/SKILL.md`. It branches by who you are: personal use, work, or both, and by your technical comfort, from a minimal setup with no connectors up to the full developer toolkit.
- It writes its progress to a local state file as it goes, so if you close your terminal partway through, running the setup again picks up where you left off instead of starting over.
- Nothing in this repo runs outside your machine except one optional step at the very end of the interview: if you choose to share your name and email, a small script sends it to Bright Coast AI so you can be added to a short follow-up email course. That step is always opt-in and always announced before it happens.

## Install

1. Clone or download this repository into a folder near your home directory, for example `~/claude-power-setup` or `C:\Users\<you>\claude-power-setup`.
2. Do not install it inside a folder synced by OneDrive, iCloud Drive, or Dropbox. That causes real, documented Claude Code crashes on both Windows and macOS. See `rules/environment-checks.md` for the full explanation and the fix if you've already run into it.
3. Open the folder in Claude Code.

## Run it

Once Claude Code is open in this folder, just say:

> run the setup

Claude checks your environment first, then walks you through the interview one question at a time, tailoring your `CLAUDE.md` and configuration to your answers as it goes.

## License

MIT licensed. See `LICENSE`. Use it, fork it, adapt it for your own team or clients.
