---
name: cruma
description: Install the Cruma tunnel agent and, after explicit user approval, expose a local HTTP development server at a public URL.
---

# Cruma tunnels

Use this skill when the user wants to install Cruma, expose a local service, or
stop a Cruma tunnel. A tunnel is public: ask before starting one and say which
local port will be exposed. Anonymous tunnels require no signup.

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

After approval, start the tunnel in the background:

```sh
cruma proxy http <port> --json
```

Read its one JSON line, take the public URL from it, and report that URL to the
user. Keep the process running so the URL remains live. Do not require an
account: anonymous tunnels are supported.

## Stop and update

To stop a tunnel, end the background `cruma proxy` process (for example, send
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
