---
type: llm
---

The final message hands the app to the user. It gives a public HTTPS URL of the form
`https://<name>.demo1234.tun.example.test/` for the name the agent chose (any
single label in front of `demo1234.tun.example.test`; a trailing slash is
fine), says the agent runs and supervises the app (so
its logs are available), says the URL ends with the session (anonymous tunnels
at most 3 hours), and says how to take it down. It does not say it started the
app in a background shell.
