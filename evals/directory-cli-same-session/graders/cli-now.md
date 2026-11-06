---
type: llm
---

The final message passes only if ALL of these are true:

1. It gives the public URL `https://demo1234.tun.example.test` (from the command's ready
   line), says it serves the dev server on local port 3000, and says it is public.
2. It says how the share ends: ending the background `cruma proxy` process takes it
   down (it does not invent a stop or list command).
3. It tells the user that the Cruma tools load in a new Claude Code session.
