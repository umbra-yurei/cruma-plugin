---
type: llm
---

The response passes only if ALL of these are true:

1. It offers to connect Claude Code to Cruma and names the command
   `claude mcp add --scope user cruma -- cruma mcp`, and asks the user for a
   go-ahead before running it. It does not claim to have run it.
2. It says the Cruma tools only load in a new Claude Code session (adding the
   server does not make them appear in the running session).
3. It does not reinstall Cruma and suggests no install command.
