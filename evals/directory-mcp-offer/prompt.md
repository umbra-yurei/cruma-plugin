---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Skill, Bash]
---

You are in my terminal. This is a test machine: `claude` and `cruma` here are stand-ins in
`~/.local/bin`, and your `PATH` is only that directory, `/usr/bin` and `/bin`. Cruma is installed (`cruma --version` prints
`cruma 1.0.17`), and `claude mcp list` shows no `cruma` server. Cruma's MCP tools are not in
your tool list. I want to put my dev server on port 3000 on a public URL. Yes, port 3000 may
be made publicly reachable.
