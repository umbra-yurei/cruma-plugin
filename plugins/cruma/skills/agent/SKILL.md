---
name: agent
description: Use Cruma to put a local dev server port or a folder of files on a public HTTPS URL, and to install the Cruma agent when it is missing. Sharing and installing need Claude Code on the user's own computer (terminal, IDE, or the desktop app's Code tab); in claude.ai chat, on the web or mobile, it only explains that. Works through the cruma command line, and through Cruma's MCP tools once the user has connected them. Asks before installing anything, before connecting Cruma to Claude Code, and before making anything public.
---

# Cruma tunnels

Use this skill when the user wants to publish something from their machine
(a dev server port, a folder), take it down again, or install Cruma. Anything
shared is public: say exactly which port or folder becomes reachable and ask
before sharing it. Anonymous tunnels need no signup.

This plugin ships no MCP server and no installer. Everything below is done
with the `cruma` command, or with Cruma's MCP tools when they are already in
your tool list. Install or connect nothing without a clear yes from the user.

## 0. Where this works (check first)

Sharing a port, installing `cruma` and `claude mcp add` all need a shell on the
**user's own computer**, where their dev server runs. That is Claude Code: the
terminal, an IDE extension or the desktop app's Code tab. In claude.ai chat (web,
the desktop app's chat, mobile) a shell is Claude's code-execution container, not
the user's machine: a tunnel started there would put a public URL on a port in
that container, not on the user's dev server.

Go on to section 1 only when one of these is true:

- Cruma's MCP tools are in your tool list. Only a local `cruma mcp` provides
  them, and chat does not load local servers.
- You have a shell tool and `printenv CLAUDECODE` prints `1` (PowerShell:
  `$env:CLAUDECODE`). Claude Code sets it in every shell it starts. Run it in
  the same call as `cruma --version --json` (section 1).
- You have no shell tool, so you can run nothing, and the user has said they are
  in Claude Code on their own computer. Then only describe the steps; start
  nothing.

Otherwise (the variable is empty or unset, there is no shell tool and the user
did not say they are in Claude Code, or you know this is a Cowork task: its shell
is a virtual machine, and nothing documented tells it apart from the user's own
shell) you cannot confirm this is the user's machine. Say so in a few lines
and stop:

- "Sharing your dev server needs Claude Code on your own computer, because
  Cruma has to run next to the server it shares."
- Claude Code is installed with `npm install -g @anthropic-ai/claude-code`
  (other ways: https://code.claude.com/docs/en/overview); the plugin with
  `claude plugin marketplace add umbra-yurei/cruma-plugin` then
  `claude plugin install cruma@cruma-plugin`. If they installed the plugin from
  claude.ai, it is already synced into Claude Code and appears at the next
  session start.
- You can still answer questions about Cruma from its docs
  (https://cruma.io/llms.txt). Questions about their account (plan, tunnels,
  sites) belong to the optional `cruma-cloud` plugin.

Never install or run `cruma`, run `claude mcp add`, start a file server or offer
a public URL from a shell you cannot confirm is the user's machine, even when
the user asks you to.

## 1. Which path are you on

1. **Are Cruma's MCP tools in your tool list?** (`expose_local_port`,
   `expose_local_directory`, `list_shares`, `unexpose`, from a server named
   `cruma`.) If so, use them (section 5) and skip everything about installing
   and connecting.
2. **Is the agent installed?** Run `printenv CLAUDECODE; cruma --version --json`
   (in PowerShell `$env:CLAUDECODE; cruma --version --json`). If the first line
   is not `1`, stop as section 0 says, whatever the second part printed. Older
   agents print `cruma <version>` for `cruma --version`; use that line then. If
   the version prints, Cruma is installed: check it (section 6), then go to
   section 3. If the command is not found, go to section 2.

## 2. The agent is missing: ask, then install

Do not run an install command before the user says yes. Pick exactly one
method from the table, then say, in one message:

- that the `cruma` agent is not installed, and what installing means: it
  puts the `cruma` program on this machine and downloads it from the source
  named below;
- the one method you would use (the command, or on a Mac with neither
  Homebrew nor npm the signed DMG steps below) and where it comes from;
- a question: "Shall I run it?"

On a Mac, first look for an existing `Cruma.app` (`ls -d /Applications/Cruma.app
~/Applications/Cruma.app`). If there is one, Cruma is installed and `cruma` is
just not on `PATH`: install nothing, use its `Contents/MacOS/cruma` by full path
(step 7 below) and, if the user wants the window, open it (step 8).

Find out what the machine has with `command -v brew` and `command -v npm`
(`Get-Command winget, npm` on Windows). When you cannot run commands, go by what
the user says; if they say nothing about Homebrew on a Mac, offer the
Homebrew row.

| This machine | Method | Source |
| --- | --- | --- |
| macOS (Apple Silicon) with `brew` | `brew install --cask umbra-yurei/brew/cruma` (the signed desktop app and its `cruma` command; use `--cask`, the formula with the same name is Linux-only) | Homebrew, tap `umbra-yurei/brew` |
| macOS (Apple Silicon) with `npm`, no `brew` | `npm install -g cruma` (the terminal agent; no `sudo` with a user-level npm prefix) | the `cruma` package on npm |
| macOS (Apple Silicon) with neither | the signed, notarized DMG installed as `Cruma.app` (**Signed DMG on a Mac**) | `files.cruma.io` (cruma.io) |
| Linux with `brew` | `brew install umbra-yurei/brew/cruma` | Homebrew, tap `umbra-yurei/brew` |
| Linux with `npm`, no `brew` | `npm install -g cruma` (the terminal agent; no `sudo` with a user-level npm prefix) | the `cruma` package on npm |
| Windows | find the Cruma product with `winget search Cruma --source msstore`, then `winget install --id <StoreProductId> --source msstore --accept-package-agreements --accept-source-agreements` | Microsoft Store |
| Windows without `winget` or its `msstore` source, with `npm` | `npm install -g cruma` (the terminal agent, x64; the desktop app comes from the Microsoft Store listing, https://apps.microsoft.com/detail/9NXKT3W34HVL) | the `cruma` package on npm |
| Anything else | no command: point the user to https://cruma.io for the install options | cruma.io |

Offer exactly one method and mention no other. There is no Intel Mac build yet
(`uname -m` prints `x86_64` on one): say so and install nothing. Never download
a Windows `.exe`. On Windows,
first check whether the Store package is already there with
`Get-AppxPackage -Name 'Umbra-Yurei.Cruma'`; if it is, do not install again: the `cruma` command then needs a newly opened
terminal (or a new Claude session), and may need Cruma switched on under
Settings, Apps, Advanced app settings, App execution aliases. Tell the user
that and stop until `cruma --version` works. Never start a Python or other
file server meanwhile, and never invent a URL.

- **They say yes:** run exactly that method, then run `cruma --version --json`.
  If it still is not found, say so (a new terminal or `PATH` change is usually
  needed) and stop; do not try a second install method.
- **They decline, or do not answer:** run nothing. Give them the command to
  run themselves, point to https://cruma.io for other methods, and stop. Do not
  install by another route, and do not fall back to a file server.

**After an npm install,** read `build_flavor` from `cruma --version --json`;
do not assume it. If it is `server-agent`, say in one line that this build has
no desktop window. If the user then wants the desktop app, offer the signed
DMG (Mac) or the Store listing (Windows) as their own choice, ask first, and
tell them to run `npm uninstall -g cruma` before it: never install over an
existing install with a different method, because two `cruma` commands on
`PATH` let the older one win.

### Signed DMG on a Mac

Only on Apple Silicon with neither `brew` nor `npm`, and only after a yes.

1. Read the release manifest with `curl -fsSL https://files.cruma.io/files/tunnel-agent/stable.json`
   and take `macos_aarch64_url`. Never hard-code a version. Stop unless the URL
   starts with `https://files.cruma.io/`.
2. In a temporary directory (`dir="$(mktemp -d)"`), download it:
   `curl -fL -o "$dir/cruma.dmg" "<macos_aarch64_url>"`.
3. Mount it: `hdiutil attach -nobrowse -readonly -mountpoint "$dir/mnt" "$dir/cruma.dmg"`.
4. Verify `"$dir/mnt/Cruma.app"` before copying anything. All three must pass:
   - `codesign --verify --deep --strict "$dir/mnt/Cruma.app"` exits 0;
   - `spctl --assess --type execute -vv "$dir/mnt/Cruma.app"` says `accepted`
     with `source=Notarized Developer ID`;
   - `codesign -dv --verbose=2 "$dir/mnt/Cruma.app" 2>&1` prints
     `TeamIdentifier=YRK5M8FHAV`, the team that signs the Homebrew cask's app.

   If any check fails: `hdiutil detach "$dir/mnt"`, `rm -rf "$dir"`, install
   nothing, tell the user which check failed, and stop. Do not retry and do not
   offer another install method.
5. Copy with `ditto "$dir/mnt/Cruma.app" /Applications/Cruma.app`. If
   `/Applications` is not writable, create `~/Applications` and copy to
   `~/Applications/Cruma.app` instead. Never use `sudo`.
6. `hdiutil detach "$dir/mnt"`, then `rm -rf "$dir"`.
7. The app does not put `cruma` on `PATH`. Use the full path
   `/Applications/Cruma.app/Contents/MacOS/cruma` (or the `~/Applications` one)
   for the rest of the session, including in `cruma --version --json`. Tell the
   user the line that puts it on `PATH` (`export PATH="/Applications/Cruma.app/Contents/MacOS:$PATH"`
   in their shell profile). Do not edit a shell profile unless they ask.
8. Ask whether to open the desktop window; open it (`open -a Cruma`) only after a
   yes. Then run `cruma --version --json` (the full path) and report the version
   it prints.

## 3. Connect Claude Code to the agent (optional, ask first)

Cruma's MCP tools give the coding agent more than the command line does. They
come from `cruma mcp`, a local program that starts nothing public by itself.
Once per session, when `cruma` is installed and its MCP tools are not in your
tool list, offer to connect it. Run `claude mcp list` first; if it already
shows a `cruma` server, do not add it again: tell the user the tools load in a
new Claude Code session (and that `/mcp` shows whether the server connected).

Otherwise ask: "Shall I connect Claude Code to Cruma? It runs
`claude mcp add --scope user cruma -- cruma mcp`, which adds a user-level MCP
server named `cruma` that starts the `cruma` program on this machine." Run the
command only after a yes. If they decline, do not ask again this session and
continue with section 4.

After running it, say plainly: **the Cruma tools load in a new Claude Code
session**; adding a server does not make its tools appear in the session that
is already running. Do not promise otherwise. Anything the user asked for in
this session is done through the command line (section 4). In a later session,
use the tools (section 5).

If `cruma` is only reachable by the full path of an app installed from the DMG,
the command is `claude mcp add --scope user cruma -- <full path> mcp`.

Other coding agents add the same server with their own command (for example
`codex mcp add cruma -- cruma mcp`). Give it to the user instead of running
it for a client you are not.

## 4. Without the MCP tools: the command line

Use only the commands `cruma --help` documents. Ask for a go-ahead that names
the port or folder before starting anything, and ask whether something that
looks private (an admin UI, a database tool, a folder with credentials or
`.env` files) should get a login first. `--user <USERNAME> <PASSWORD>` on
either command below puts a login form in front of it.

| Goal | Command |
| --- | --- |
| Publish a dev server that is already running | `cruma proxy http <port> --json` |
| Publish a folder | `cruma serve <folder> --json` |

Start it as a background process: the tunnel lives as long as the command
runs. It prints exactly one JSON line on standard output once the tunnel is up
(everything else goes to standard error):

- `{"event":"ready", ...}` carries `public_urls` (report the first one) and
  `assigned_domain`;
- `{"event":"error", ...}` carries `message`: report it, and do not invent a
  URL.

**List what is shared.** There is no command that lists running shares. Keep
your own list of the commands you started in this session (what each serves,
its URL and the background process) and report that list.

**Stop one.** There is no stop command either: end the background process you
started for it. Tell the user its URL stops working once the process ends.

Each of these commands runs its own agent with its own tunnel, separate from
the one `cruma mcp` uses. When the user later connects the tools, tell them
anything started here is not listed by the tools, and offer to stop it.

Never start `python3 -m http.server`, `npx serve` or another file server to
publish a folder.

## 5. With the MCP tools

When the tools are in your tool list, use them and not the shell commands in
section 4: `cruma proxy` and `cruma serve` would start a second agent and
tunnel.

| The user wants to | Use |
| --- | --- |
| Publish a dev server | `expose_local_port` with its port and a `name` |
| Publish a folder | `expose_local_directory` with the folder and a `name` |
| See what is shared | `list_shares` |
| Take one down | `unexpose` with its name |
| Check the result | `get_health_summary` (`status` should be `ok`) |

Name each share by what it is (`docs`, `api`); one agent serves many shares at
once, each at its own address. Ask before the first share, naming the port or
folder. Pass `access` (a password or an IP allowlist; the tool schema lists the
types) for something that looks private, after asking; a generated password is
returned once. Before the first share of a session, call `list_agents` once. If
a running agent other than the temporary session agent has `tunnel_account`
`registered` (the user's desktop app or a headless agent with tunnel
credentials), ask once whether to use it (`use_agent`) or a temporary
anonymous tunnel, and share nothing until they answer. Shares on the temporary
agent end with the session; never set `persist` for them.

For anything else (sign-in, filters, domains, routing, processes, rules), do
not guess: read `describe_cruma` (or the resource `cruma://about`), then
`get_config_model_reference` for the section you need, then the docs as
Markdown (`https://cruma.io/llms.txt`, and any chapter at
`https://cruma.io/book/cruma-tunnels/<chapter>.md`), then
`cruma <command> --help`. Use the tool they point to. If they do not support
what was asked, say so; do not invent a setting or a tool.

## 6. Versions and updates

The minimum agent version is **1.0.12**. If `cruma --version` shows an older
one, say so before doing anything else, give the upgrade command for the way
it was installed, and share nothing until the user has upgraded. Upgrade only
the way Cruma was installed; never replace an install with another method (that
leaves two `cruma` commands and the older one can win). If the method is not
known, ask.

| Installed with | Upgrade |
| --- | --- |
| Homebrew cask (macOS) | `brew upgrade --cask umbra-yurei/brew/cruma` |
| Homebrew formula (Linux) | `brew upgrade umbra-yurei/brew/cruma` |
| npm | `npm update -g cruma` |
| Signed DMG (macOS) | quit Cruma, then repeat the signed DMG steps of section 2 (same checks) and replace `Cruma.app` |
| Microsoft Store (Windows) | update Cruma in Microsoft Store, then open a new terminal and restart Claude |

Give the row for the user's install, exactly as written, and name no other
row. Restart the Claude Code session after an upgrade so the MCP server starts
the new agent.

## 7. Hand-off

After sharing, tell the user: each public URL and what it serves (the local
port or folder); that it is public; how you will take it down (`unexpose` with
the name, or ending the background process); that URLs end with the session
(the tunnel is also time-limited while anonymous). Say once per session, when
a tool result's `account.state` is `anonymous` or the tunnel is anonymous, that
signing in to a free Cruma account (`cruma auth login`) keeps the same tunnel
working past the limit, with `account.sign_up_url` quoted exactly when the
result carries it. Say nothing about accounts when the result says
`signed_in`.

Account features (plan, account tunnels, sites) belong to the optional
`cruma-cloud` plugin, not to this skill.
