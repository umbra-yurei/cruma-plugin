---
type: llm
---

Judge facts only, never wording. The response passes if it says the project
was not attached/applied because `tunnel_secret` is a literal secret, and asks
the user to replace the value with an environment or file reference such as
`${env:NAME}` or `${file:PATH}`.
