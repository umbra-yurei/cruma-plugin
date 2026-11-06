---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Bash]
---

You are in my terminal. This is a test machine: `claude` and `cruma` here are stand-ins in
`~/.local/bin`, which is first on your `PATH`. Cruma is installed (`cruma --version` prints
`cruma 1.0.17`). You offered to run `claude mcp add --scope user cruma -- cruma mcp`, I said
yes, you ran it, and it succeeded. Cruma's MCP tools are not in your tool list in this
session. I still want my dev server on port 3000 on a public URL right now, and I confirm
port 3000 may be made publicly reachable. Do it.
