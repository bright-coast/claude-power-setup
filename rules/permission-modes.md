# Permission Modes

| Mode | What runs without asking | Best for |
|---|---|---|
| default | Reads only | Reviewing every action |
| plan | Reads, explores before changing anything | Understanding before you commit to a change |
| acceptEdits | Reads + file edits + safe filesystem commands | Iterating on code you're reviewing |
| auto | Everything, with background safety checks | Long tasks, once you trust the setup |
| bypassPermissions | Everything, no checks | Isolated containers only; never your main machine |

Anthropic's own guidance: auto mode "reduces permission prompts but does not guarantee safety... not a replacement for review on sensitive operations." Start on `plan` or `acceptEdits` and move to `auto` once you've seen how Claude behaves in your own setup.
