---
type: llm
---

Judge facts only, never wording. The final message passes if ALL of these facts
are present:

1. The URL `https://docs.acme.tun.example.test`.
2. It was served on the user's desktop agent (profile `work`), not the temporary
   session tunnel.
3. The share is temporary: not saved, and gone when the agent restarts or the
   share is removed.
4. A way to take it down.
