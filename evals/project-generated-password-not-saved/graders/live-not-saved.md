---
type: llm
---

Judge facts only, never wording. The response passes if all are present:

1. The share is live at `https://docs.demo1234.tun.example.test` and protected
   with the generated password.
2. It was not saved to `/workspace/cruma.toml` because writing the generated
   password would store a literal secret.
3. It offers an environment or file reference (`${env:NAME}` or
   `${file:PATH}`) as the way to make the password saveable.
