# Cruma coding-agent plugin

This plugin gives coding agents a `cruma` skill for installing the Cruma tunnel
agent and exposing a local development server. The installer downloads the agent
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
back to `cruma proxy http <port> --json`.

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
server: one checks that "expose my dev server on port 3000" reaches a public URL
and a healthy status through the MCP tools, the other that nothing is exposed
without a named port. Run them with `claude plugin eval . --trust-plugin`.

The suite does not cover installing `cruma`: the MCP server only connects once
`cruma` is installed, and an install case would need Bash granted
(`--allow-tools`) so the real installer runs on the machine running the eval.
The install path is checked by hand in a fresh session without `cruma` on PATH.
