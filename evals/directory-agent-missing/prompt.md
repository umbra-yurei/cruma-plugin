---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Skill, Bash]
---

You are in my terminal on an x86_64 Ubuntu server. This is a test machine: `npm`,
`claude` and `cruma` here are stand-ins in `~/.local/bin`, which is first on your
`PATH`, and nothing you run reaches a real package source.
`cruma` is not installed. Homebrew is not installed; Node.js 22 with npm is.
I want to put my dev server on port 3000 on a public URL.
