---
name: cruma
description: Install the Cruma tunnel agent and, after explicit user approval, expose a local HTTP development server at a public URL. Uses the cruma MCP tools when connected.
---

# Cruma tunnels

Use this skill when the user wants to install Cruma, expose a local service, or
stop a Cruma tunnel. A tunnel is public: ask before starting one and say which
local port will be exposed. Anonymous tunnels require no signup.

## Use the MCP tools when they are connected

This plugin starts `cruma mcp`, a local MCP server named `cruma` that runs the
installed `cruma` binary. When its tools are in your tool list, prefer them to
shell commands for exposing a port, checking health, captured requests, routes,
processes and firewall/WAF rules. The server starts with nothing exposed; a
tunnel is created only by the tool calls below and lasts for this session.

| Goal | Tools |
| --- | --- |
| Expose a port | `expose_local_port` if the tool list has it, otherwise the three-step sequence below |
| Health and tunnel state | `get_health_summary`, `get_runtime_summary`, `get_certificate_status` |
| Captured requests | `set_request_recording`, `list_recorded_requests`, `inspect_recorded_request`, `clear_recorded_requests` |
| Routes | `get_proxy_routes`, `simulate_route`, `probe_route` |
| Processes | `upsert_process`, `start_process`, `stop_process`, `get_process_logs` |
| Firewall and WAF | `get_firewall_rules`, `upsert_firewall_rule`, `get_waf_rules`, `upsert_waf_rule` |

Do not assume every tool exists: `screenshot_url` is missing in some builds, so
check the tool list before relying on it. Firewall and WAF changes persist
immediately; describe the rule and get approval first.

To expose a port without `expose_local_port`, after the user approves:

1. Call `get_runtime_summary`. `assigned_domain` is `null` for a few seconds
   while the tunnel connects; call it again until it is set.
2. Call `upsert_backend` with `{"backend":{"id":"dev-<port>","kind":"http","destination":"127.0.0.1:<port>"}}`.
3. Call `upsert_frontend` with `{"frontend":{"hostname":"<assigned_domain>","backend_id":"dev-<port>"}}`.
4. Call `get_health_summary`; `status` should be `ok`.

When you hand off, say all four of these in the final message:

1. The public URL: `public_url` from `expose_local_port`, or
   `https://<assigned_domain>/` on the fallback path. Do not give any other URL.
2. The local port it forwards to.
3. That `get_health_summary` reported `ok`, called after the expose step. If it
   did not, report the status and issues instead of claiming success.
4. Which path you used: `expose_local_port` or `upsert_backend`/`upsert_frontend`.

Nothing is written to disk, so do not ask the user to edit a file. To stop,
call `unexpose` (or `remove_frontend` and then `remove_backend` on the fallback
path); the tunnel closes when the session ends.

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

## Expose a local server

Before exposing anything, ask the user for explicit confirmation and name the
local port that will become publicly reachable. Do not start a tunnel until
they approve.

With the MCP tools connected, use them as above. Otherwise, after approval,
start the tunnel in the background:

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

## Stop and update

To stop a tunnel started with the MCP tools, see above. To stop one started with
`cruma proxy`, end the background `cruma proxy` process (for example, send
it Ctrl-C in the terminal where it runs, or stop the process started for this
request). Tell the user that the public URL stops working once the process
ends.

For Homebrew installations, update with `brew upgrade`. For the Linux curl
installer or Windows PowerShell installer, re-run the corresponding installer.

## Environments without a shell

In Claude.ai chat, Cowork, or another environment that cannot run shell
commands, explain the appropriate install and `cruma proxy http <port> --json`
commands for the user's platform. Tell the user to run them locally, to approve
the public exposure before running the proxy command, and to share the JSON
output if they want help identifying the public URL.
