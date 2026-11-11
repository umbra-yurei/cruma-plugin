---
name: board
description: Turn the Cruma board on or off for the user's coding agents on every machine (`/cruma-cloud:board on` or `off`), or use the board in this session. Only when the user invokes it.
argument-hint: "on | off | <request>"
disable-model-invocation: true
---

# Cruma board

Arguments: $ARGUMENTS

The board setting belongs to the user's Cruma account, not to this machine or
folder: it applies to every new coding-agent session signed in to that account,
on every machine.

## Needs cruma-cloud

Everything here goes through the `cruma-cloud` tools (`whoami`,
`list_services`, `get_coding_agent_settings`, `update_coding_agent_settings`).
When they are not in your tool list, say that `/cruma-cloud:board` needs the optional
`cruma-cloud` server signed in to their Cruma account, give the steps to connect it for where they are (on claude.ai: open
https://claude.ai/customize/plugins, open `cruma-cloud`, and on its **Connectors**
tab **Add** the connector if needed, then **Connect** and sign in, then start a new
chat; in Claude Code: `/mcp`, select `plugin:cruma-cloud:cruma-cloud`,
**Authenticate**; in Codex: `codex plugin add cruma-cloud@cruma-plugin`), and stop. Never use the local
`cruma` tools for this.

## `on`

1. Call `update_coding_agent_settings` with `board_enabled: true` and nothing
   else.
2. Call `list_services`. The board service is listed once the board is on. If
   it is not, say the board is on but the account has no Cruma board access,
   report as in step 6 and stop.
3. Call `describe_service` for it, then its tool that lists the user's boards.
   Take the tool's name from the description; do not guess it.
4. Unless the arguments already name them, show the boards and ask which to
   enable and which is the default. Save the answer with one
   `update_coding_agent_settings` call: `boards` (each `id` and `label` as
   listed) and `default_board_id`.
5. If the settings `update_coding_agent_settings` returned show
   `agents_may_write: false`, ask whether coding agents may change the board
   (the same permission lets them write memory). Set `agents_may_write: true`
   only on an explicit yes.
6. Say exactly what changed: the board is on, the enabled boards, the default,
   and whether agents may write. It applies from the next session, on every
   machine signed in to this account; this session stays as it is.

## `off`

Call `update_coding_agent_settings` with `board_enabled: false` and nothing
else. Say exactly what changes: from the next session, coding agents get no
board note and the board service is not listed. The enabled boards and the
write permission are kept for the next `/cruma-cloud:board on`.

## No argument, or a request

Use the board in this session: `list_services`, then `describe_service` for
the board service, then follow the guide it points to and act on the request.
Report what you wrote, with ids. When the board service is not listed, say the
board is off (`/cruma-cloud:board on` turns it on) or the account has no board
access, and call no board tool.

## The session note

In Claude Code, this plugin's session-start hook adds the account's note
through the local `cruma` agent signed in to the same account (`cruma auth
login`). Clients without that hook (Codex and others) call `session_context`
once at the start of a session when `cruma-cloud` is connected.
