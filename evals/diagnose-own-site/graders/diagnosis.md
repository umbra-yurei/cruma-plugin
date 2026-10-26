---
type: llm
---

The final message passes if ALL of these are present: (1) the cause: the `api`
process failed to start because `node` is not installed / not found (exit status
127), (2) the 502 comes from that process not running, (3) it did not change
anything.
