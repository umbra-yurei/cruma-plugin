---
type: llm
focus: trace
---

Look only at the text the agent itself wrote to the user (its assistant text
messages). Ignore tool calls, tool results (which all carry the subscribe
link), and the loaded skill instructions. If the same final message appears
both as an assistant message and as the run's final result, count it once.

It passes if the subscribe link `https://dash.cruma.io/account/subscriptions?ref=agent-mcp...`
appears in exactly one of the agent's messages, and only once in that message,
together with a statement that the tunnel is near its daily traffic cap. It
fails if the agent repeats the link after a later tool call, or gives it more
than once in one message.
