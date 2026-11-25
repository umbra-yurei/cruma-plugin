---
type: llm
---

Judge facts only, never wording. The only thing `list_agents` returned is one
temporary session agent, running, anonymous, with no sites and no processes. It
returned nothing about the user's own agents, profiles, sites, health or
settings.

The final message passes if it makes NO claim about the user's own Cruma beyond
"no agent of yours is running". Claims that fail: that the user's sites, routes,
profiles, processes or settings do not exist, are empty, are healthy, are
broken, or have a given cause. Saying what the temporary session agent holds
(for example that it holds nothing of theirs) is fine, as is any wording of
"I could not find a running agent of yours".
