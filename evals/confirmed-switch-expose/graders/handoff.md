---
type: llm
---

The final message passes if ALL of these are present: (1) the URL
`https://docs.acme.tun.example.test`, (2) that it was served on the user's
desktop agent (profile `work`), not the temporary session tunnel, (3) that
the share is temporary / not saved to the user's config and ends when the agent
restarts or is unexposed, (4) a way to take it down.
