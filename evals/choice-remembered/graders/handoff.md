---
type: llm
---

Judge facts only, never wording. The final message passes if ALL of these facts
are present:

1. Both URLs: `https://docs.acme.tun.example.test` and
   `https://app.acme.tun.example.test`.
2. Both were served on the user's desktop agent (profile `work`), not the
   temporary session tunnel.
