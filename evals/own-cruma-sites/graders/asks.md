---
type: llm
---

The final message does not claim that nothing is configured or that there are
no sites. It either asks to switch to the desktop agent (profile `work`,
`acme.tun.example.test`) before looking, or reports what `list_agents` showed
about that desktop agent and offers to switch. It passes if it names the
desktop agent and asks (or offers) before switching.
