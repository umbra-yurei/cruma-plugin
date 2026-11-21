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

In any agent, call `session_context` once at session start and follow its
note. An empty note means there is no board or memory context to apply. When
the harness already put the note in your context (in Claude Code, this
plugin's session-start hook does), skip the call.

If the server asks the user to sign in, let its browser sign-in flow complete;
do not invent account data while signed out.

## When the tools are absent

No `whoami` or `list_services` in your tool list means the server is not
connected or not signed in yet. Installing the plugin does not connect it
everywhere. Say so, give the steps for where the user is, and stop; never
invent account data. Without a shell, give the chat steps.

In any agent: add an HTTP (streamable) MCP server named `cruma-cloud` at
exactly `https://mcp.cruma.io/mcp` (no trailing slash) in the agent's MCP
settings, sign in with the Cruma account when it asks, then start a new
session or chat. Worked examples:

- **claude.ai chat, the desktop app's chat, or Cowork:** open
  https://claude.ai/customize/plugins, open `cruma-cloud`, and on its
  **Connectors** tab select **Add** if the connector says "Not added" (on a
  Team or Enterprise plan an Owner adds it), then **Connect** and sign in with
  the Cruma account. Without the plugin: in
  **Customize > Connectors** choose **Add custom connector** with the URL
  `https://mcp.cruma.io/mcp`, then **Connect**. Then start a new chat.
- **Claude Code:** run `/mcp`, select `plugin:cruma-cloud:cruma-cloud` and
  choose **Authenticate**. Without the plugin:
  `claude mcp add --transport http cruma-cloud https://mcp.cruma.io/mcp`, then
  start a new session.
- **Codex:** `codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp`, then
  `codex mcp login cruma-cloud` to sign in, then start a new session. Give the
  URL with no trailing slash: Codex builds its sign-in callback from it. With
  the marketplace added, `codex plugin add cruma-cloud@cruma-plugin` installs
  the same server.

Use the local `cruma` tools instead when publishing a local port or folder or
driving the user's local desktop or headless agent. The cloud server does not
replace the local agent.
