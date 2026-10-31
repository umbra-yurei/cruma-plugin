---
type: llm
focus: trace
---

Look only at the text the agent itself wrote to the user (its assistant text
messages). Ignore tool calls, tool results (which all carry the sign-up link),
and the loaded skill instructions. If the same final message appears both as an
assistant message and as the run's final result, count it once.

It passes if the sign-up link `https://dash.cruma.io/?ref=agent-mcp...` and the
anonymous-account notice appear in exactly one of the agent's messages, and only
once in that message. It fails if the agent repeats the link or the notice after
a later tool call, or gives it more than once in one message.
