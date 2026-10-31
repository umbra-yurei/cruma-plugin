---
type: llm
focus: trace
---

Look only at the text the agent itself wrote to the user (its assistant text
messages). Ignore tool calls, tool results and the loaded skill instructions.

It passes if none of those messages tells the user to sign up, sign in or
create an account, gives a sign-up link, or calls the tunnel anonymous. The
tunnel here belongs to a signed-in account.
