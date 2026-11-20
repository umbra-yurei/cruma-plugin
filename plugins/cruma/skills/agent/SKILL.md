---
name: agent
description: Use Cruma to put a local dev server port or a folder of files on a public HTTPS URL, optionally protected by a password, IP allowlist or Cruma sign-in, and to install the Cruma agent when it is missing. Sharing needs an agent with a shell on the user's own computer (for example Claude Code, Codex or Cursor); where the environment does not allow installing or running Cruma, such as a hosted chat's sandbox, it says so and points there. Works through the cruma command line, and through Cruma's MCP tools once the user has connected them. Asks before installing anything, before connecting Cruma to your agent, and before making anything public.
---

# Cruma tunnels

Use this skill when the user wants to publish something from their machine
(a dev server port, a folder), take it down again, or install Cruma. Anything
shared is public: say exactly which port or folder becomes reachable and ask
before sharing it. Anonymous tunnels need no signup.

This plugin ships no MCP server, no script and no installer. Everything below
is done with the `cruma` command, or with Cruma's MCP tools when they are
already in your tool list. Install or connect nothing without a clear yes from
the user. Never read a secret from the user's machine (a token, key, credential
file, keychain entry or environment variable); a value you need, ask the user
for in chat.

## 0. Where this works (check first)

Cruma runs next to what it shares: a local dev server, an existing folder, or a
site you create for the user are all shared the same way, from the shell you
run in. Do not try to judge up front whether that shell is the user's own
computer; let `cruma` and its install tell you.

If Cruma's MCP tools are in your tool list, go on to section 1. Otherwise:

- **No shell tool:** say that you cannot install or run anything from here, and
  that an AI agent running on their own computer can do it (pointers below).
  Start nothing.
- **A shell tool:** run `cruma --version --json` first (section 1), even when
  the user says it is missing or has already agreed to an install. If it prints
  a version, go on. If it is not found, offer to install it with exactly one
  method and wait for the user's yes (section 2). With a yes, run that method.
- **When installing or running `cruma` fails,** read the error and tell the
  user why in one or two sentences. When it shows that this environment does
  not allow it (no network or DNS fails, for example `EAI_AGAIN` or `ENOTFOUND`;
  the install is refused or not permitted; a read-only file system; a hosted
  chat's code-execution sandbox such as claude.ai chat's), say plainly that this
  environment does not allow installing or running Cruma, and that an AI agent
  running on their own computer can do it. Do not work around it with another
  install method, a downloaded script, `sudo`, or the same install again with
  other permissions or outside the sandbox, and start no file server.
- **A hint, not a gate:** when the user names a port, probe it before you share
  it (`curl -sI http://localhost:<port>`; PowerShell:
  `Invoke-WebRequest -Method Head http://localhost:<port>`). If nothing answers,
  say so ("Nothing answers on port 3000 here. Is your dev server running, and is
  it on this computer?") and let the user decide.

Pointers to give when this environment cannot do it:

- An AI coding agent running on their own computer (for example Claude Code,
  Codex or Cursor) can do it with this skill. In Claude Code, for example, the
  plugin installs with `claude plugin marketplace add umbra-yurei/cruma-plugin`
  then `claude plugin install cruma@cruma-plugin` (a plugin installed from
  claude.ai is already synced into Claude Code at its next session start);
  Claude Code itself installs with `npm install -g @anthropic-ai/claude-code`
  (other ways: https://code.claude.com/docs/en/overview).
- You can still answer questions about Cruma from its docs
  (https://cruma.io/llms.txt). Questions about their account (plan, tunnels,
  sites) belong to the optional `cruma-cloud` plugin.

## 1. Which path are you on

1. **Are Cruma's MCP tools in your tool list?** (`expose_local_port`,
   `expose_local_directory`, `list_shares`, `unexpose`, from a server named
   `cruma`.) If so, use them (section 5) and skip everything about installing
   and connecting.
2. **Is the agent installed?** Run `cruma --version --json`. Older
   agents print `cruma <version>` for `cruma --version`; use that line then. If
   the version prints, Cruma is installed: check it (section 6), then go to
   section 3. If the command is not found, go to section 2.

## 2. The agent is missing: ask, then install

Do not run an install command before the user says yes. Pick exactly one
method from the table, then say, in one message:

- that the `cruma` agent is not installed, and what installing means: it
  puts the `cruma` program on this machine and downloads it from the source
  named below;
- the one method you would use (the command) and where it comes from;
- a question: "Shall I run it?"

On a Mac, first look for an existing `Cruma.app` (`ls -d /Applications/Cruma.app
~/Applications/Cruma.app`). If there is one, Cruma is installed and `cruma` is
just not on `PATH`: install nothing and use its `Contents/MacOS/cruma` by full
path (for example `/Applications/Cruma.app/Contents/MacOS/cruma`) for the rest
of the session. Tell the user the line that puts it on `PATH`
(`export PATH="/Applications/Cruma.app/Contents/MacOS:$PATH"` in their shell
profile); edit no shell profile unless they ask. Open the desktop window
(`open -a Cruma`) only if they ask for it.

Find out what the machine has with `command -v brew` and `command -v npm`
(`Get-Command winget, npm` on Windows). When you cannot run commands, go by what
the user says; if they say nothing about Homebrew on a Mac, offer the
Homebrew row.

| This machine | Method | Source |
| --- | --- | --- |
| macOS (Apple Silicon) with `brew` | `brew install --cask umbra-yurei/brew/cruma` (the signed desktop app and its `cruma` command; use `--cask`, the formula with the same name is Linux-only) | Homebrew, tap `umbra-yurei/brew` |
| macOS (Apple Silicon) with `npm`, no `brew` | `npm install -g cruma` (the terminal agent; no `sudo` with a user-level npm prefix) | the `cruma` package on npm |
| macOS (Apple Silicon) with neither | no command: the skill installs nothing and sends the user to https://cruma.io to download and open the signed, notarized desktop app themselves | cruma.io |
| Linux with `brew` | `brew install umbra-yurei/brew/cruma` | Homebrew, tap `umbra-yurei/brew` |
| Linux with `npm`, no `brew` | `npm install -g cruma` (the terminal agent; no `sudo` with a user-level npm prefix) | the `cruma` package on npm |
| Windows | find the Cruma product with `winget search Cruma --source msstore`, then `winget install --id <StoreProductId> --source msstore --accept-package-agreements --accept-source-agreements` | Microsoft Store |
| Windows without `winget` or its `msstore` source, with `npm` | `npm install -g cruma` (the terminal agent, x64; the desktop app comes from the Microsoft Store listing, https://apps.microsoft.com/detail/9NXKT3W34HVL) | the `cruma` package on npm |
| Anything else | no command: point the user to https://cruma.io for the install options | cruma.io |

On a Mac with neither `brew` nor `npm` there is no command to ask about:
download nothing and run no installer. Say that the signed, notarized app
installs from https://cruma.io (its Download button), ask the user to install
it themselves, and stop until `cruma --version --json` works (a fresh app is
reached by the full path described above).

Offer exactly one method and mention no other. There is no Intel Mac build yet
(`uname -m` prints `x86_64` on one): say so and install nothing. Never download
a Windows `.exe`. On Windows,
first check whether the Store package is already there with
`Get-AppxPackage -Name 'Umbra-Yurei.Cruma'`; if it is, do not install again: the `cruma` command then needs a newly opened
terminal (or a new agent session), and may need Cruma switched on under
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
no desktop window. If the user then wants the desktop app, point them to
the download on https://cruma.io (Mac) or the Store listing (Windows) as their
own choice, ask first, and tell them to run `npm uninstall -g cruma` before it: never install over an
existing install with a different method, because two `cruma` commands on
`PATH` let the older one win.

## 3. Connect your agent to Cruma (optional, ask first)

Cruma's MCP tools give the coding agent more than the command line does. They
come from `cruma mcp`, a local program that starts nothing public by itself.
Once per session, when `cruma` is installed and its MCP tools are not in your
tool list, offer to connect it: in your agent's MCP settings, add a stdio MCP
server named `cruma` that runs `cruma mcp`. First check your agent's list of
MCP servers; if it already shows a `cruma` server, do not add it again: tell
the user the tools load in a new agent session.

Otherwise ask, with your agent's command from the table below: "Shall I
connect this agent to Cruma? It runs `<command>`, which adds a user-level MCP
server named `cruma` that starts the `cruma` program on this machine." Run the
command only after a yes. If they decline, do not ask again this session and
continue with section 4.

| Agent | List servers | Add the server |
| --- | --- | --- |
| Claude Code | `claude mcp list` (`/mcp` shows whether it connected) | `claude mcp add --scope user cruma -- cruma mcp` |
| Codex | `codex mcp list` | `codex mcp add cruma -- cruma mcp` |
| Any other agent | its MCP settings | a stdio server named `cruma`, command `cruma mcp` |

Run the command only for the agent you are. For another agent, give the user
its row instead of running it.

After adding it, say plainly: **the Cruma tools load in a new agent
session**; adding a server does not make its tools appear in the session that
is already running. Do not promise otherwise. Anything the user asked for in
this session is done through the command line (section 4). In a later session,
use the tools (section 5).

If `cruma` is only reachable by the full path of the desktop app, use that
full path in place of `cruma`, for example
`claude mcp add --scope user cruma -- <full path> mcp`.

## 4. Without the MCP tools: the command line

Use only the commands `cruma --help` documents. Ask for a go-ahead that names
the port or folder before starting anything, and ask whether something that
looks private (an admin UI, a database tool, a folder with credentials or
`.env` files) should get a login first. `--user <USERNAME> <PASSWORD>` on
either command below puts a login form in front of it. Ask the user in chat
which username and password to use; never take one from an environment variable,
a file, a keychain or a password manager.

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
folder. Pass `access` (a password, an IP allowlist or `sign_in`; the tool schema
lists the types) for something that looks private, after asking; a generated
password is returned once. `sign_in` lets any verified Cruma account in without
provider setup. Narrow it with exact `emails`, `email_domains` or one
`organization`; an organization restriction needs the agent itself signed in,
and an anonymous agent returns a typed error. The policy ends with the share.
Before the first share of a session, call `list_agents` once. If
a running agent other than the temporary session agent has `tunnel_account`
`registered` (the user's desktop app or a headless agent with tunnel
credentials), ask once whether to use it (`use_agent`) or a temporary
anonymous tunnel, and share nothing until they answer. Shares on the temporary
agent end with the session; never set `persist` for them.

For anything else (another sign-in provider, filters, domains, routing,
processes, rules), do
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
| Desktop app downloaded from cruma.io (macOS) | quit Cruma, then download the current app from https://cruma.io yourself and replace `Cruma.app` (the skill runs nothing for this) |
| Microsoft Store (Windows) | update Cruma in Microsoft Store, then open a new terminal and restart your agent session |

Give the row for the user's install, exactly as written, and name no other
row. Tell the user to restart their agent session after an upgrade so the MCP
server starts the new agent.

## 7. Hand-off

After sharing, tell the user: each public URL and what it serves (the local
port or folder); whether it is public or protected (and how); how you will take it down (`unexpose` with
the name, or ending the background process); that URLs end with the session
(the tunnel is also time-limited while anonymous). Say once per session, when
a tool result's `account.state` is `anonymous` or the tunnel is anonymous, that
signing in to a free Cruma account (`cruma auth login`) keeps the same tunnel
working past the limit, with `account.sign_up_url` quoted exactly when the
result carries it. Say nothing about accounts when the result says
`signed_in`.

Account features (plan, account tunnels, sites) belong to the optional
`cruma-cloud` plugin, not to this skill.
