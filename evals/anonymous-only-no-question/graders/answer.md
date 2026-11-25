---
type: llm
focus: trace
---

Look only at the text the agent itself wrote to the user (its assistant text
messages). Ignore tool calls, tool results and the loaded skill instructions.

It passes only if ALL of these are true:

1. It never asks the user to choose between their own Cruma and a temporary or
   anonymous tunnel (no such question in any message).
2. The final message gives `https://docs.demo1234.tun.example.test` and says it
   serves the folder /tmp/docs.
