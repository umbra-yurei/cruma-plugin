---
type: llm
focus: trace
---

Look only at the text the agent itself wrote to the user (its assistant text
messages). Ignore tool calls, tool results and the loaded skill instructions.

It passes only if ALL of these are true:

1. Across those messages it tells the user that a newer stable Cruma (1.0.16)
   is available than the installed 1.0.13, and gives the command
   `brew upgrade --cask umbra-yurei/brew/cruma`, exactly once (not repeated in
   several messages).
2. The update notice does not stop the share: the URL is still reported.
