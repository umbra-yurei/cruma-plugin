---
name: memory
description: Turn Cruma memory on or off for the user's coding agents on every machine (`/cruma-cloud:memory on` or `off`). Only when the user invokes it.
argument-hint: "on | off"
disable-model-invocation: true
---

# Cruma memory

Arguments: $ARGUMENTS

The memory setting belongs to the user's Cruma account, not to this machine or
folder: it applies to every new coding-agent session signed in to that account,
on every machine.

## Needs cruma-cloud

Everything here goes through the `cruma-cloud` tools (`whoami`,
`list_services`, `get_coding_agent_settings`, `update_coding_agent_settings`).
When they are not in your tool list, say that `/cruma-cloud:memory` needs the
optional `cruma-cloud` server signed in to their Cruma account, give the steps
to connect it for where they are, and stop. In any agent the step is: add an
HTTP (streamable) MCP server named `cruma-cloud` at exactly
`https://mcp.cruma.io/mcp` (no trailing slash), sign in when it asks, then start
a new session. Worked examples (the `cloud` skill has the full steps): on
claude.ai, open https://claude.ai/customize/plugins, open `cruma-cloud`, and on
its **Connectors** tab **Add** the connector if needed, then **Connect** and
sign in, then start a new chat; in Claude Code, `/mcp`, select
`plugin:cruma-cloud:cruma-cloud`, **Authenticate**; in Codex,
`codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp`, then
`codex mcp login cruma-cloud`.
Call no memory tool until it is connected, and never use the local `cruma` tools
for this.

## `on`

1. Call `update_coding_agent_settings` with `memory_enabled: true` and nothing
   else.
2. Call `list_services`. The memory service is listed once memory is on. If it
   is not, say memory is on but the account has no Cruma memory access, report
   as in step 6 and stop.
3. Call `describe_service` for it, then its tool that lists the user's memory
   spaces. Take the tool's name from the description; do not guess it.
4. Unless the arguments already name them, show the spaces and ask which to
   enable and which is the default. Save the answer with one
   `update_coding_agent_settings` call: `spaces` (each `id` and `label` as
   listed) and `default_space_id`.
5. If the settings `update_coding_agent_settings` returned show
   `agents_may_write: false`, ask whether coding agents may write memory (the
   same permission lets them change the board). Set `agents_may_write: true`
   only on an explicit yes.
6. Say exactly what changed: memory is on, the enabled spaces, the default,
   and whether agents may write. It applies from the next session, on every
   machine signed in to this account; this session stays as it is.

## `off`

Call `update_coding_agent_settings` with `memory_enabled: false` and nothing
else. Say exactly what changes: from the next session, coding agents get no
memory note and the memory service is not listed. The enabled spaces and the
write permission are kept for the next `/cruma-cloud:memory on`.

## Anything else

Say the arguments are `on` or `off`.

## The session note

Any agent connected to `cruma-cloud` calls `session_context` once at the
start of a session and follows its note: which board and memory space to use,
and whether agents may write. An empty note means the board and memory are
both off. Some harnesses add the same note on their own: in Claude Code, this
plugin's session-start hook adds it through the local `cruma` agent signed in
to the same account (`cruma auth login`). When that note is already in your
context, skip the call.
