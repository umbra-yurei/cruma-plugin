---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Skill, Bash]
---

This is an x86_64 Ubuntu machine, and a test: `npm`, `node`, `uname`, `curl`, `claude` and `cruma` here are
stand-ins in `~/.local/bin`, and your `PATH` is only that directory, `/usr/bin` and `/bin`.
Node.js 22 with npm is available; Homebrew is not.
Share the folder ./site on a public URL. If Cruma isn't installed, yes: install it with `npm install -g cruma`.
