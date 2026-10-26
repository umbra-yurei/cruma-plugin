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
| `trigger-*` | "serve this folder", "put a password on my site", "run two sites at once" and "help me with my Cruma app" load the skill; "deploy to Vercel" does not |

Run them with `claude plugin eval . --trust-plugin`.

The suite does not cover installing `cruma`: the MCP server only connects once
`cruma` is installed, and an install case would need Bash granted
(`--allow-tools`) so the real installer runs on the machine running the eval.
The install path is checked by hand in a fresh session without `cruma` on PATH.
