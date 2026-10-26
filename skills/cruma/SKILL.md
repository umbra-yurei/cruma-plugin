---
name: cruma
description: Use Cruma to put local things on a public HTTPS URL and manage them - a dev server port, a folder of files, several named sites at once, password or IP protection, agent-hosted dev servers. Also for inspecting or changing the user's own running Cruma desktop or headless agent (sites, routes, processes, logs), and for installing Cruma. Asks before exposing anything.
---

# Cruma tunnels

Use this skill when the user wants to publish something from their machine,
manage what Cruma already serves, or install or stop Cruma. Anything shared is
public: ask before sharing and say exactly which port or folder becomes
reachable. Anonymous tunnels need no signup.

## With the cruma MCP tools

This plugin starts `cruma mcp`, a local MCP server named `cruma` that runs the
installed `cruma` binary. When its tools are in your tool list, use them, not
shell commands. The server starts with nothing exposed.

**Before choosing an approach**, read the resource `cruma://about` (or call
`describe_cruma`) and load the schemas of the tools you will call. It says what
Cruma can do; do not guess from this file. If the user wants a password or IP
allowlist on a share, find out there how, before exposing, and say so if it is
not possible.

**Never serve things yourself.** Do not start `python3 -m http.server`,
`npx serve` or any other file server, and do not run `cruma serve` or
`cruma proxy`: with MCP connected they start a second agent with its own tunnel.

### Whose Cruma

The tools start attached to a **temporary session agent**: an anonymous tunnel
that your windows share and that holds nothing the user saved. For "expose my
dev server" and "serve this folder", use it as is and report the URLs.

It is not the user's own Cruma. When the request is about *their* Cruma (their
app, sites, routes, domains, processes or logs: "why does my site return 502?",
"add a password to my staging site", "what's running in my Cruma?"), or they
want their own tunnel, a custom domain or a named profile, call `list_agents`
**before any tool that reads or changes an agent** (`describe_cruma` and
`cruma://about` are fine first). Reading the session agent answers about a
setup that is not theirs, so never read it for such a request.

- **Ask before `use_agent`**, naming the agent's kind (desktop, headless),
  profile and domain, and wait for the answer. Never switch for a plain share.
  The share tools then work on that agent. Switching withdraws the shares you
  made on the previous one.
- **Before the switch, say only which agent you would switch to and ask.** Do
  not describe what either agent holds (the session agent's included), and do
  not state or hint at a cause, a diagnosis or what is configured, even when
  `list_agents` shows a process summary (a phase such as `Failed`) or site
  names: that is a listing, not a diagnosis. Name the target (kind, profile,
  domain), ask, and stop. Diagnose after the switch, from the user's agent.
- `use_agent` never starts an agent. If none is running for what the user
  means, say so and ask them to open the desktop app, or run
  `cruma --profile <name>` (use the name `list_agents` gives for a stopped
  profile). Do not fall back to the temporary tunnel for a request about their
  own sites.
- No `list_agents` among your tools means an older agent: use the temporary
  tunnel for shares and say a newer `cruma` is needed for the user's own.
- A Cruma HTTP MCP server already in the user's client (for example
  `cruma-app`) *is* their own agent. Use its tools for requests about their
  Cruma and this plugin's for temporary shares. If it failed to connect, say
  so rather than using the session agent. `list_agents` marks the agent that
  serves HTTP `/mcp`.

On the user's own agent, after they agreed to the switch:

- **Reading** is free: `get_health_summary`, `get_site_summary`,
  `get_proxy_routes`, `probe_route`, `get_process_logs`,
  `list_recorded_requests`.
- **Changes** apply to the running agent and are gone when it restarts. Say so.
- **Permanent changes** ("set up a site for good") need `persist: true`, and
  the agent refuses it unless the user turned on "Let them save changes"
  (`mcp.local_socket.allow_persistent_changes`; desktop MCP page, "Coding
  Agents on This Computer"). Never quietly make an in-memory change instead.
  Explain the setting and ask them to turn it on, or to make the change in the
  app. Once it is on (`allow_persistent_changes` is `true` in `list_agents`),
  do **not** call a write tool with `persist: true` yet: first describe the
  exact change (frontend, backend, middleware) as your reply and ask whether to
  save it. Pass `persist: true` only after the user clearly approved that exact
  change: a yes to your description in a later turn, or, in the same message,
  an explicit approval that names the backend and the frontend by kind and name
  as a saved change ("I approve exactly this saved change: ..."). Asking for a
  "permanent" or "saved" site, even with a name and a path, is a request, not
  approval: describe the change and ask. Never re-send an existing setting
  with `persist: true` to make it permanent without the same approval. This is
  the only use of `persist`, and never on the session agent.

### What to use for what

| The user wants to share | Do this |
| --- | --- |
| Files: a page you wrote, a build output, docs | `expose_local_directory` with the folder and a `name`. Write the files first if needed. |
| A dev server that is already running | `expose_local_port` with its port and a `name`. |
| An app that is not running yet | Have the agent host it: `upsert_process` (the agent allocates `PORT`; make the command listen on it), then `upsert_frontend` at `<name>.<assigned_domain>` with `process_id` set. Logs come through `get_process_logs`. Only if that does not fit, start it in the background yourself and say so. |
| Several things | One call per share. One agent serves many sites and ports at once, each at `<name>.<assigned domain>`: frontend and API, docs and app, two versions side by side. Name each by what it is (`docs`, `api`, `preview-v2`). |

If `expose_local_directory` or `expose_local_port` is missing (an older agent),
use `upsert_backend` (`http` for a port, `local-directory` for a folder) and
`upsert_frontend` at `<name>.<assigned_domain>`, without `persist`. Get `assigned_domain` from
`get_runtime_summary`; it is `null` for a few seconds while the tunnel
connects, so call it again. Do not stop at "update cruma".

After exposing, call `get_health_summary`; `status` should be `ok`. Use
`list_shares` to report every live URL.

### Hand-off

Say all of these in the final message:

1. Every public URL (`public_url`, or `https://<name>.<assigned_domain>/` on the
   fallback path) and what each one serves, including the local port or folder.
   Give no other URL.
2. That `get_health_summary` reported `ok`, called after the expose step; if
   not, the status and issues instead of claiming success.
3. Which path you used: `expose_local_port`, `expose_local_directory`,
   `upsert_process` (the agent hosts and supervises the app, so its logs are
   available through `get_process_logs`), or `upsert_backend`/`upsert_frontend`.
4. Which agent you acted on: kind (desktop, headless or temporary session),
   profile and domain, so a temporary share is never taken for a change to
   the user's app.
5. For the session agent: the URLs end with the session, anonymous tunnels
   last at most 3 hours, and nothing is written to disk. For the user's own
   agent: whether the change is temporary or saved.
6. How to take one down: ask you, and you call `unexpose` with its name for
   an `expose_*` share, or `remove_frontend`, `remove_backend` and
   `remove_process` for an `upsert_*` one. For a folder share, that editing
   the files updates the site immediately.

Take down only what the user asks. Shares from `expose_*` are withdrawn by
`unexpose`. What you created with `upsert_*` outlives this window (windows share
one session agent), so remove it when done: `remove_frontend`, `remove_backend`
and `remove_process`.

### Other tools

| Goal | Tools |
| --- | --- |
| Health and tunnel state | `get_health_summary`, `get_runtime_summary`, `get_certificate_status` |
| Captured requests | `set_request_recording`, `list_recorded_requests`, `inspect_recorded_request`, `clear_recorded_requests` |
| Routes | `get_proxy_routes`, `simulate_route`, `probe_route` |
| Processes | `upsert_process`, `start_process`, `stop_process`, `get_process_logs` |
| Firewall and WAF | `get_firewall_rules`, `upsert_firewall_rule`, `get_waf_rules`, `upsert_waf_rule` |

Do not assume every tool exists: check the tool list. Firewall and WAF changes
persist immediately; describe the rule and get approval first.

If the `cruma` tools are not in your tool list, the MCP server is not connected
(for example `cruma` was missing when the session started, or you are in
Claude.ai chat or Cowork). Use the shell path below.

## Detect and install

First run `cruma --version`. If it succeeds, use that installation. If it is
missing, install without `sudo` for the user's platform.

### macOS

Apple Silicon Macs can install the signed and notarized application with:

```sh
brew install --cask umbra-yurei/brew/cruma
```

Use `--cask`: the formula with the same name is Linux-only. There is no Intel
Mac build yet; explain that limitation rather than suggesting an unsupported
installation.

### Linux

On x86_64 or arm64, when Homebrew is available, run:

```sh
brew install umbra-yurei/brew/cruma
```

Otherwise, the x86_64-only installer is:

```sh
curl -fsSL https://files.cruma.io/files/tunnel-agent/install/linux-install.sh | bash
```

On Linux arm64 without Homebrew, explain that the curl installer does not yet
support that architecture.

### Windows

Find the current Microsoft Store product ID:

```powershell
winget search Cruma --source msstore
```

Then install the matching product ID with:

```powershell
winget install --id <StoreProductId> --source msstore --accept-package-agreements --accept-source-agreements
```

If Winget or its Microsoft Store source is unavailable, use the PowerShell
installer instead:

```powershell
irm https://files.cruma.io/files/tunnel-agent/install/win-install.ps1 | iex
```

## Without the MCP tools

Before exposing anything, ask the user for explicit confirmation and name the
local port that will become publicly reachable. After approval, start the
tunnel in the background:

```sh
cruma proxy http <port> --json
```

Read its one JSON line. When `event` is `"ready"`, report the first address in
`public_urls` to the user and keep the process running so the URL remains live.
When `event` is `"error"`, report the error and inspect the logs on stderr;
do not invent a URL. Do not require an account: anonymous tunnels are
supported. If you installed `cruma` during this session, the MCP tools stay
unavailable until the plugin is reloaded or Claude Code restarts, so keep using
this path and tell the user.

There is no one-line command for a folder. Do not start a Python or other file
server: install `cruma`, tell the user to restart the session so the MCP tools
connect, then use `expose_local_directory`.

To stop a tunnel started with `cruma proxy`, end that background process (for
example, send it Ctrl-C in the terminal where it runs, or stop the process
started for this request). Tell the user that the public URL stops working once
the process ends.

## Update

For Homebrew installations, update with `brew upgrade`. For the Linux curl
installer or Windows PowerShell installer, re-run the corresponding installer.

## Environments without a shell

In Claude.ai chat, Cowork, or another environment that cannot run shell
commands, explain the appropriate install and `cruma proxy http <port> --json`
commands for the user's platform. Tell the user to run them locally, to approve
the public exposure before running the proxy command, and to share the JSON
output if they want help identifying the public URL.
