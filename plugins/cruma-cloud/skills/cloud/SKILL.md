---
name: cloud
description: Use the signed-in Cruma account and the services it enables through cruma-cloud, including plan details, account tunnels and sites, Cruma board, and Cruma memory.
---

# Cruma cloud

Use this skill for the user's Cruma account: `whoami`, their plan, account
tunnels and sites, and services available through Cruma's hosted gateway.

Start with `list_services`. Use only services it returns, and call
`describe_service` before using a service's tools. Cruma board and Cruma memory
are available through this server only when the user has enabled them. The
user-invoked `/cruma-cloud:board on|off` and `/cruma-cloud:memory on|off`
skills control those account settings.

In clients without the SessionStart hook, including Codex, call
`session_context` once at session start and follow its note. An empty note
means there is no board or memory context to apply. Claude Code receives the
same note from this plugin's hook, so do not call `session_context` there.

If the tools are absent, explain that `cruma-cloud` is optional and must be
installed or connected. If the server asks the user to sign in, let its browser
sign-in flow complete; do not invent account data while signed out.

Use the local `cruma` tools instead when publishing a local port or folder or
driving the user's local desktop or headless agent. The cloud server does not
replace the local agent.
