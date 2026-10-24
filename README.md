# Cruma Claude Code plugin

This plugin gives Claude Code a `cruma` skill for installing the Cruma tunnel
agent and exposing a local development server. The installer downloads the
agent from [files.cruma.io](https://files.cruma.io). A tunnel makes the selected
local service reachable at a public URL, so only expose a service after the
user has confirmed that it is safe to share. Tunnels can be anonymous: no
account or signup is required to start one.

Add the marketplace, then install the plugin:

```sh
claude plugin marketplace add umbra-yurei/cruma-plugin
claude plugin install cruma
```

In Claude Code, ask to expose a local service, for example: “Expose my dev
server on port 3000.” The skill checks for the agent, installs it without
`sudo` when needed, asks for confirmation before making anything public, and
reports the public URL.
