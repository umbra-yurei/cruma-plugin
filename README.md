# Cruma coding-agent plugin

This plugin gives coding agents a `cruma` skill for installing the Cruma tunnel
agent and publishing local things: a dev server port, a folder of files served
by the agent itself (no separate file server), an app the agent hosts for you,
or several named sites at once. The installer downloads the agent
from [files.cruma.io](https://files.cruma.io). A tunnel makes the selected local
service reachable at a public URL, so only expose a service after the user has
confirmed that it is safe to share. Tunnels can be anonymous: no account or
signup is required to start one.

## Codex and other skills-compatible agents

Install the included `skills/cruma/SKILL.md` skill with:

```sh
npx skills add umbra-yurei/cruma-plugin
```

Then ask your agent to expose a local service, for example: “Expose my dev
server on port 3000.” The skill checks for the agent, installs it without
`sudo` when needed, asks for confirmation before making anything public, and
reports the public URL.

## Claude Code

The plugin also connects a local MCP server named `cruma` (`.mcp.json` runs
`cruma mcp`). It runs the `cruma` binary installed on your machine, with its
own anonymous agent, and exposes nothing until Claude calls a tool that does.
When `cruma` is not installed, the MCP server fails to start and the skill falls
back to `cruma proxy http <port> --json` for a port; a folder waits for the MCP
tools. With the tools connected the skill never starts a Python or other file
server and never runs `cruma serve` or `cruma proxy`. Every share has its own
name and URL (`<name>.<your tunnel domain>`), the final message lists each one
and what it serves, and the URLs end with the session (anonymous tunnels last
at most 3 hours).

To work on your own running Cruma (the desktop app or a headless agent: its
sites, routes, processes and logs) instead of the temporary session tunnel,
ask for it; the skill lists your running agents and asks before switching to
one.

Add the marketplace, then install the plugin:

```sh
claude plugin marketplace add umbra-yurei/cruma-plugin
claude plugin install cruma@cruma-plugin
```

In Claude Code, ask to expose a local service, for example: “Expose my dev
server on port 3000.” The skill checks for the agent, installs it without
`sudo` when needed, asks for confirmation before making anything public, and
reports the public URL.

## Evals

`evals/` holds `claude plugin eval` cases that run against a mocked `cruma` MCP
server:

| Case | Checks |
| --- | --- |
| `expose-dev-server` | "expose port 3000" reaches a public URL and a healthy status through `expose_local_port` (or the `upsert_backend` + `upsert_frontend` fallback) |
| `asks-before-exposing` | nothing is exposed without a named port or folder |
| `serve-folder` | "serve /tmp/docs" uses `expose_local_directory` and starts no shell process (no Python, `npx serve`, `cruma serve`, `cruma proxy`) |
| `two-shares` | a folder and a port at once give two shares and two reported URLs |
| `hosted-app` | an app that is not running is hosted by the agent (`upsert_process`) |
| `own-tunnel`, `own-cruma-sites`, `own-cruma-502`, `own-tunnel-add-site` | requests about the user's own Cruma call `list_agents` first and ask before `use_agent`; nothing is read from or added to the temporary session agent |
| `confirmed-switch-expose`, `diagnose-own-site` | after a confirmed switch the order is `list_agents`, `use_agent`, then the work; diagnosis reads logs and changes nothing |
| `persist-disabled`, `persist-enabled`, `persist-approved` | `persist: true` is sent only after the user approved the exact change and saving is on; with saving off the skill points to "Let them save changes" |
| `no-agent-running` | with no desktop agent running the skill asks to open the app and shares nothing |
| `desktop-http-server` | a connected desktop HTTP MCP server answers questions about the user's own Cruma |
| `windows-store-alias-missing` | a Store-installed Windows app with no `cruma` command gets update/new-session alias guidance and never falls back to a file server or invented URL |
| `trigger-*` | "serve this folder", "put a password on my site", "run two sites at once" and "help me with my Cruma app" load the skill; "deploy to Vercel" does not |

Run them with `claude plugin eval . --trust-plugin`.

The suite does not run an installer: the MCP server only connects once `cruma`
is available. The `windows-store-alias-missing` case is shell- and
PowerShell-dependent, so run it on Windows with the Microsoft Store Cruma app
installed and its `cruma` app execution alias unavailable in that session:

```powershell
claude plugin eval . --trust-plugin --case windows-store-alias-missing --allow-tools Bash
```

Before running it, verify that `cruma --version` fails and that
`Get-AppxPackage -Name 'Umbra-Yurei.Cruma'` returns the installed package. The
remaining install paths are checked by hand in a fresh session without
`cruma` on `PATH`.
