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

If the server asks the user to sign in, let its browser sign-in flow complete;
do not invent account data while signed out.

## When the tools are absent

No `whoami` or `list_services` in your tool list means the server is not
connected or not signed in yet. Installing the plugin does not connect it
everywhere. Say so, give the steps for where the user is, and stop; never
invent account data. Without a shell, or when the user is on claude.ai, give
the chat steps.

- **claude.ai chat, the desktop app's chat, or Cowork:** open
  https://claude.ai/customize/plugins, open `cruma-cloud`, and on its
  **Connectors** tab select **Add** if the connector says "Not added", then
  **Connect** and sign in with the Cruma account. Without the plugin: in
  **Customize > Connectors** choose **Add custom connector** with the URL
  `https://mcp.cruma.io/mcp`, then **Connect**. Then start a new chat.
- **Claude Code:** run `/mcp`, select `plugin:cruma-cloud:cruma-cloud` and
  choose **Authenticate**. Without the plugin:
  `claude mcp add --transport http cruma-cloud https://mcp.cruma.io/mcp`, then
  start a new session.
- **Codex:** `codex plugin add cruma-cloud@cruma-plugin`, or
  `codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp`, then start a new
  session.

Use the local `cruma` tools instead when publishing a local port or folder or
driving the user's local desktop or headless agent. The cloud server does not
replace the local agent.
