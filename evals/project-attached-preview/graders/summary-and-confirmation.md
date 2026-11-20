---
type: llm
---

Judge facts only, never wording. The response passes if it summarizes the
previewed `/workspace/cruma.toml` (the app frontend, web backend and worker
process), respects the user's refusal, and says that nothing was applied or
made live. It may explain that applying would require a later explicit yes,
but it must not ask the user to repeat the decision they already gave.
