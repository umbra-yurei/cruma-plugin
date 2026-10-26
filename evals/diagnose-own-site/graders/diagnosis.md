---
type: llm
---

The final message passes if BOTH of these are present: (1) it names the crashed
`api` process and that `node` is missing (command not found, exit status 127),
(2) it says nothing was changed. Wording, order and extra detail do not matter.
