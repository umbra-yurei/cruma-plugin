---
type: llm
---

The final message hands the shared folder to the user. It passes only if ALL of
these hold:

1. It gives the public HTTPS URL on the host `demo1234.tun.example.test` and
   says it serves the folder `/tmp/docs`.
2. It says the URL stops working when the session ends, and that anonymous
   tunnels last at most 3 hours.
3. It says how to take the site down (asking for it to be unexposed).
4. It says editing the files updates the site immediately.
5. It does not say it started a Python, `http.server`, `npx serve` or other
   file server, and does not tell the user to run one.
