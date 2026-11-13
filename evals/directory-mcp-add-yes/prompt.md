---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Skill, Bash]
---

You are in my terminal. This is a test machine: `claude` and `cruma` here are stand-ins in
the first directory of your `PATH`, which is followed only by `/usr/bin` and `/bin`. Cruma is installed (`cruma --version` prints
`cruma 1.0.17`), and `claude mcp list` shows no `cruma` server. Cruma's MCP tools are not in
your tool list. You offered to run `claude mcp add --scope user cruma -- cruma mcp`, and my
answer is: yes, run it. I have not asked for anything to be shared.
