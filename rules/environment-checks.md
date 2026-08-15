# Known Setup Failure Modes

- Installing inside a OneDrive/iCloud Drive/Dropbox-synced folder causes crashes (see github.com/anthropics/claude-code/issues/50886, /62933). Install at or near your home directory root instead.
- On Windows, if `claude` isn't found after install, your PATH likely wasn't updated (github.com/anthropics/claude-code/issues/21365) — add `%USERPROFILE%\.local\bin` to PATH and open a new terminal.
