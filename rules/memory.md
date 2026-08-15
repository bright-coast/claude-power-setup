# Memory

Claude Code can build a persistent, file-based memory of you and your work over time, across sessions, not just within one conversation.

It's worth distinguishing a few kinds of memory:

- **User**: who you are, your role, your preferences and working style.
- **Feedback**: corrections or confirmations about how you and Claude should work together, so the same correction doesn't have to be given twice.
- **Project**: ongoing facts, decisions, and deadlines tied to a specific piece of work.
- **Reference**: pointers to where information actually lives, a file, a system, a doc, rather than a copy of the information itself.

Save a memory when you learn something that would help in a future conversation, not just this one. Task-specific details that only matter until the current task is done don't belong in memory; they're noise that makes the memories worth keeping harder to find later.

Keep an index file, `MEMORY.md`, as a short list of pointers to the memory files that exist, not the memories themselves. The index should be skimmable in a few seconds; the detail lives in the individual files it points to.

This should happen naturally as Claude works with you. You don't need to ask it to "start" or manage a memory system: just correct it when it gets something wrong, or tell it a preference, and it should pick up the practice described in this file on its own.
