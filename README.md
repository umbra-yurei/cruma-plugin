# Cruma coding-agent plugins

This marketplace has three plugins. All of them let a coding agent put a dev
server port or a folder on a public Cruma URL. A tunnel makes the selected
local service reachable by anyone, so the skills share something only after the
user has confirmed it. Tunnels can be anonymous: no account is needed.

| Plugin | What it is | Who it is for |
| --- | --- | --- |
| `cruma` | Skill only: no MCP server, no hooks, no scripts. Submitted to Anthropic's plugin directory. Sharing needs a coding agent with a shell on your own computer. | Everyone; install this one from the directory |
| `cruma-local` | The same skill plus a bundled local MCP server (`mcp/launcher.mjs` starts `cruma mcp`), for any harness that loads plugin MCP servers (for example Claude Code through `.mcp.json`, Codex through `mcp.json`). Never submitted to the directory. | People who want the tools from the first session, with no separate step to connect `cruma mcp` |
| `cruma-cloud` | Optional hosted MCP server for your Cruma account. | People who ask about their plan, tunnels and sites |

### Packaging

One repository serves more than one harness. Each manifest names its format in
`$schema`, the one field both Claude's schema (whose `--strict` validation
rejects unknown keys) and the Agent Plugins schema accept for it.

| File | Read by (examples) | Schema (`$schema`) |
| --- | --- | --- |
| `.claude-plugin/marketplace.json` | Claude Code, Codex (`codex plugin marketplace add`) | `https://anthropic.com/claude-code/marketplace.schema.json` |
| `plugins/*/.claude-plugin/plugin.json` | Claude Code, claude.ai, Anthropic's plugin directory | `https://anthropic.com/claude-code/plugin.schema.json` |
| `plugins/*/plugin.json` | Codex and other Agent Plugins harnesses | `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` |
| `plugins/*/.mcp.json` | Claude Code, claude.ai | Claude's plugin MCP form (no `$schema`) |
| `plugins/*/mcp.json` | Codex and other Agent Plugins harnesses | `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` |

Both `plugin.json` files of a plugin carry the same version.

## The `cruma` plugin (skill only)

```sh
claude plugin marketplace add umbra-yurei/cruma-plugin
claude plugin install cruma@cruma-plugin
```

The plugin directory holds only file types Anthropic's directory accepts from an
unverified organization (Markdown, text, JSON, YAML, PNG/JPEG/GIF/WebP/ICO images,
plus the license); `scripts/check-plugin.mjs` fails when another type appears, and
its icon is `.claude-plugin/icon.png`.

### Where it works

The directory lists a skill-only plugin on every surface: claude.ai chat (web,
the desktop app's chat, mobile), Cowork and Claude Code. Sharing a port or a
folder and installing `cruma` need a shell on your own computer, the one your
dev server or folder is on, where installing a program is allowed. Any AI coding
agent running there (for example Claude Code, Codex or Cursor) can do it; the
skill does not check for a particular agent and reads no environment variable.
A plugin installed on claude.ai is synced into Claude Code at its next session start.

The skill does not try to judge up front whether its shell is your computer. A
local dev server, an existing folder or a site the agent builds for you are all
shared the same way, from the shell the agent runs in. Section 0, "Where this
works", is the order it follows:

- with Cruma's MCP tools in its tool list (a local `cruma mcp`), it uses them;
- with a shell, it runs `cruma --version --json`, and when Cruma is missing
  offers one install method and runs it only after your yes;
- when installing or running `cruma` fails, it reads the error and tells you why
  in a sentence or two. When the environment does not allow it (no network or
  DNS, the install refused, a read-only file system, a hosted chat's sandbox such
  as claude.ai chat's), it says so and points to an AI agent running on your own
  computer (for example Claude Code, Codex or Cursor, with the Claude Code plugin
  commands as one example). It does not work around the block with another
  method, a script or `sudo`, and starts no file server;
- with no shell, it says it cannot install or run anything from there and points
  to such an agent, starting nothing.

Before sharing a port it probes `localhost:<port>` (`curl -sI`, or
`Invoke-WebRequest` in PowerShell) as a hint: when nothing answers it says so
and asks whether your dev server is running on that computer. It still answers
questions about Cruma from the docs and points account questions to `cruma-cloud`.

The skill (`cruma:agent`) then works in three steps and asks before each of the
first two:

1. **Install.** It runs `cruma --version`. When the agent is missing it says
   what installing means and where the program comes from, names the one method,
   and runs it only after a yes. On a Mac it is the Homebrew cask, else
   `npm install -g cruma`, else nothing: it sends you to https://cruma.io to
   download the signed, notarized app yourself and carries on once `cruma` works. Linux uses Homebrew,
   else npm. Windows uses the Microsoft Store, else `npm install -g cruma` (the
   terminal agent). A no ends the install: it prints the command for you and stops.
   It never pipes a downloaded script into a shell.
2. **Connect.** It offers `claude mcp add --scope user cruma -- cruma mcp` and
   runs it only after a yes. **The Cruma tools load in a new Claude Code
   session**, not the running one; the skill says so.
3. **Share.** In the same session it uses the command line, with only the flags
   `cruma --help` documents (`cruma proxy http <port> --json`,
   `cruma serve <folder> --json`). In later sessions it uses the MCP tools
   and does not run `cruma proxy` or `cruma serve`.

The skill-only `cruma` plugin needs agent 1.0.12 or newer. It works in any
agent with a shell on your computer; Codex and other skills-compatible agents
can also use the `cruma-local` skill, which needs agent 1.0.19 or newer and
whose plugin bundles the MCP server:
`npx skills add https://github.com/umbra-yurei/cruma-plugin/tree/main/plugins/cruma-local`
(the repository holds two skills named `agent`, so the command names the plugin's
directory), and `codex mcp add cruma -- cruma mcp` to connect the tools.

### What this plugin runs, sends and fetches

This is the answer to the directory form's "Does any skill send data to a
service other than the declared connectors?": yes, as described here. The plugin
declares no connectors.

- **Runs, on your computer, each after a yes where it changes something:**
  `cruma --version`, and `curl -sI http://localhost:<port>` to see whether
  your dev server answers before sharing it; the one install command for your
  system (`npm install -g cruma`, `brew install --cask umbra-yurei/brew/cruma` or
  `brew install umbra-yurei/brew/cruma`, or on Windows `winget install` from the
  Microsoft Store); `claude mcp add --scope user cruma -- cruma mcp`;
  and `cruma proxy http <port> --json` or `cruma serve <folder> --json`.
- **Fetches:** the `cruma` package from npm, Homebrew or the Microsoft Store and
  nothing else. The plugin ships no scripts and pipes
  nothing into a shell.
- **Sends:** `cruma` connects to Cruma's tunnel service and relays the traffic of
  the port or folder you named to its public URL; that is the point of the
  plugin. The tunnel registration carries how the agent was launched, the build
  flavour (desktop or server), the version, the operating system and the CPU
  architecture, plus a random install ID unless telemetry is off
  (`CRUMA_NO_TELEMETRY=1`); no user content and no machine hostname. Request logs
  stay on your computer.
- **Stores:** nothing. The plugin keeps no files or state. Optional basic-auth
  credentials go to the local agent only. (`cruma` keeps its own identity and
  certificates in its cache directory; see the [security chapter](https://cruma.io/book/cruma-tunnels/security).)
- **Privacy policy:** https://cruma.io/privacy (declared as `privacyPolicyUrl` in
  `.claude-plugin/plugin.json`).

### Submitting the `cruma` plugin to the directory

The privacy policy is in the Claude manifests of all three plugins. The terms of
service field (`termsOfServiceUrl`) is not set: cruma.io has no terms page yet,
and the field is added once one is published. The plugin carries no hooks and no
local MCP server; `node scripts/check-plugin.mjs` enforces both. The Codex
`plugin.json` follows the Agent Plugins schema, which has no privacy field.

## The `cruma-local` plugin (bundled MCP server)

```sh
claude plugin install cruma-local@cruma-plugin
codex plugin marketplace add umbra-yurei/cruma-plugin
codex plugin add cruma-local@cruma-plugin
```

Its skill is `cruma-local:agent`. Codex reads `plugins/cruma-local/mcp.json`
(Agent Plugins form: `node ${PLUGIN_ROOT}/mcp/cruma-mcp.mjs`); Claude Code reads
`plugins/cruma-local/.mcp.json`. It asks for no sign-in.

### Moving from the old `cruma` plugin

Before this split, `cruma` was the bundled-server plugin. That plugin is now
`cruma-local`, with the same files and version line. If you installed the old
one and want to keep the bundled server:

```sh
claude plugin uninstall cruma@cruma-plugin
claude plugin marketplace update cruma-plugin
claude plugin install cruma-local@cruma-plugin
```

Codex: `codex plugin remove cruma@cruma-plugin`, then
`codex plugin add cruma-local@cruma-plugin`. The MCP tool names change from
`mcp__plugin_cruma_cruma__*` to `mcp__plugin_cruma-local_cruma__*`. If you would
rather use the skill-only plugin, leave `cruma` installed (it is now the
skill-only one after the update), accept its offer to run
`claude mcp add --scope user cruma -- cruma mcp`, and do not install both at
once: two `cruma` MCP servers answer the same tools.

### What the bundled server does

The plugin connects a local MCP server named `cruma` (`plugins/cruma-local/.mcp.json` runs
`node ${CLAUDE_PLUGIN_ROOT}/mcp/cruma-mcp.mjs`, a short launcher in this
repository that needs Node.js). The launcher starts `cruma mcp` from the `cruma`
installed on your machine (the macOS app, Homebrew, `/usr/local/bin`,
`~/.local/bin`, the Windows Store alias, then `PATH`; the newest wins) with its
own anonymous agent, and exposes nothing until Claude calls a tool that does.
It passes `cruma mcp` only the environment variables named in
`plugins/cruma-local/mcp/environment.mjs`, so a process the agent hosts for you (started with
`upsert_process`) does not inherit the rest of your shell's environment, such as
`NODE_ENV` or `GOPATH`: put what it needs in the process's own settings. It downloads nothing. When `cruma` is not installed, it prints how to install
it and the MCP server fails to start and the skill falls
back to `cruma proxy http <port> --json` for a port; a folder waits for the MCP
tools. With the tools connected the skill never starts a Python or other file
server and never runs `cruma serve` or `cruma proxy`. Every share has its own
name and URL (`<name>.<your tunnel domain>`), the final message lists each one
and what it serves, and the URLs end with the session (or earlier, when an
anonymous tunnel reaches its time limit; the skill tells you how long is left).

For anything beyond sharing one port or folder (sign-in, IP filters, WAF rules,
custom domains, routing), the skill does not guess: it reads what Cruma says
about itself first (the agent's `cruma://about` and config model reference,
then the docs at [cruma.io](https://cruma.io/llms.txt) as Markdown, then
`cruma <command> --help`) and uses the tool they point to. Before it exposes
something that looks private (an admin UI, a database tool, internal docs,
credentials) it asks whether to protect it and suggests a password. Sign-in
with a Cruma account needs no setup (optionally limited to emails, email
domains or one organization); Google or another provider needs one configured
on your own Cruma, otherwise the skill offers a password or a Cruma sign-in.

When a signed-in Cruma of yours is running (the desktop app or a headless agent
with tunnel credentials), the skill asks once, before the first share, whether
to use it or a temporary anonymous tunnel, and keeps your answer for the
session. With no such agent running, or where it cannot ask, it uses the
temporary tunnel without a question and says so.

To work on your own running Cruma (the desktop app or a headless agent: its
sites, routes, processes and logs) instead of the temporary session tunnel,
ask for it; the skill lists your running agents and asks before switching to
one.

Ask to expose a local service, for example: “Expose my dev
server on port 3000.” The skill checks for the agent, installs it without
`sudo` when needed, asks for confirmation before making anything public, and
reports the public URL.

### When Claude Code suggests the plugin

The marketplace entry declares `relevance` signals, so Claude Code can suggest
installing the plugin ("Working with tunnels? Install the cruma plugin: …").
Matching happens locally on your machine; nothing is reported to Cruma or
Anthropic, and nothing installs until you confirm. Claude Code suggests the
plugin when, in a session:

- Claude runs a command that starts with `ngrok`, `cloudflared`, `localtunnel`,
  `lt` or `cruma` (only the first word of a command counts), or
- Claude reads a `package.json` that depends on `vite`, `next`,
  `@sveltejs/kit` or `webpack-dev-server`.

Suggestions appear only when your organization has listed this marketplace
(`cruma-plugin`) or the official directory in `pluginSuggestionMarketplaces`
in its managed settings, and at most once every three sessions. Setting
`spinnerTipsEnabled` to `false` turns off the spinner tip and the
session-start notice.

## Cruma cloud (optional)

`cruma-cloud` is a second plugin in this marketplace. It holds one MCP server,
Cruma's hosted `https://mcp.cruma.io/mcp`, for questions about your Cruma
account: your plan, the tunnels and sites on the account, and the other
services it lists. Its first use opens your browser to sign in. Neither `cruma` nor `cruma-local`
includes it, so local tunnels never ask you to sign in.

```sh
claude plugin install cruma-cloud@cruma-plugin   # Claude Code
codex plugin add cruma-cloud@cruma-plugin        # Codex, after `codex plugin marketplace add umbra-yurei/cruma-plugin`
```

Or add the server by hand, in any agent, as an HTTP (streamable) MCP server
named `cruma-cloud` at exactly `https://mcp.cruma.io/mcp` (no trailing slash):
`claude mcp add --transport http cruma-cloud https://mcp.cruma.io/mcp`, or
`codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp` then `codex mcp login
cruma-cloud`. With it connected, the skill starts account
questions with `list_services` and `describe_service`; without it, it says the
server is optional and gives these commands.

**claude.ai chat, the desktop app's chat and Cowork** list the plugin's server on
the plugin's **Connectors** tab (Customize > Plugins > `cruma-cloud`), but adding
the plugin neither adds nor connects it: the skill loads with no `mcp.cruma.io`
tools until the user selects **Add** (when it reads "Not added"; on Team and Enterprise plans an Owner adds it), then
**Connect**, signs in, and starts a new chat. Adding `https://mcp.cruma.io/mcp`
under Customize > Connectors > **Add custom connector** works the same way. The
`cloud`, `board` and `memory` skills give these steps when the tools are absent.
Claude Code reads `.mcp.json` itself and asks for sign-in through `/mcp`.
`.mcp.json` uses the `{"mcpServers": {…}}` form that claude.ai documents for a
plugin's Connectors tab; `scripts/check-plugin.mjs` requires it.

## Board and memory for your coding agents (optional)

Two skills turn Cruma's board and memory on or off for your coding agents. Only
you run them; the model never loads them on its own:

```text
/cruma-cloud:board on     /cruma-cloud:board off
/cruma-cloud:memory on    /cruma-cloud:memory off
```

They need `cruma-cloud` signed in. `on` turns the setting on, lists your boards
(or memory spaces), asks which to enable and which is the default, and asks
whether agents may write (one permission covers the board and memory). `off`
turns it off and keeps your choices for the next `on`. The settings live on
your Cruma account, so they apply to every new session on every machine signed
in to it, not to one folder or repository.

At session start, any agent with `cruma-cloud` connected calls its
`session_context` tool once and follows the note it returns: the boards and
memory to use, empty when both are off. In Claude Code the cloud plugin's
`SessionStart` hook (`plugins/cruma-cloud/hooks/hooks.json`) adds the same note
without the call: it runs `cruma agent-context` through its bundled launcher
(`mcp/launcher.mjs`) and adds what it prints to the session, which needs the
`cruma` on this machine signed in to the account (`cruma auth login`); with
both off, no `cruma`, no sign-in or an agent older than the command, it adds
nothing and the agent calls `session_context`.

## Updating

The plugin and the `cruma` agent update separately; updating one does not
change the other.

- **The plugin** (this skill): `claude plugin marketplace update cruma-plugin`,
  then `claude plugin update cruma@cruma-plugin` (or `cruma-local@cruma-plugin`), and restart Claude Code.
  Installed copies only update when `version` in `.claude-plugin/plugin.json` changes
  (the Codex manifest `plugin.json` must match; the marketplace entry carries none),
  so every change to the plugin bumps it. `node scripts/check-plugin.mjs` enforces this.
- **The agent**, the way you installed it:

  | Installed with | Upgrade |
  | --- | --- |
  | Homebrew cask (macOS) | `brew upgrade --cask umbra-yurei/brew/cruma` |
  | Homebrew formula (Linux) | `brew upgrade umbra-yurei/brew/cruma` |
  | Linux installer script | run the installer you used again; see [cruma.io](https://cruma.io) |
  | npm | `npm update -g cruma` |
  | Desktop app from cruma.io (macOS) | download the current app from https://cruma.io yourself and replace `Cruma.app` |
  | Microsoft Store (Windows) | update Cruma in Microsoft Store |

  The skill upgrades an installed agent only with the command for its own
  install method, and installs the GUI-capable package on a desktop (the macOS
  cask, the Linux Homebrew formula, Microsoft Store; `npm install -g cruma` on Linux, or a Mac or Windows PC, without the first choice; a Mac with neither Homebrew nor npm is sent to cruma.io); it reads the build
  flavour from `cruma --version --json`.
  The `cruma-local` skill needs agent 1.0.19 or newer. It checks `cruma --version`, and with
  the MCP tools connected it mentions a newer stable release once, from the
  `version` block of `get_runtime_summary`. Restart Claude Code after
  upgrading so the MCP server starts the new agent.

## Evals

`evals/` holds `claude plugin eval` cases; `scripts/codex-eval.mjs` runs them in
Codex too (see [Running cases in Codex](#running-cases-in-codex)). The Claude Code and Codex
columns record each harness's last scored result. `directory-*` cases belong to the
skill-only `cruma` plugin; `board-`, `cloud-`, `memory-` and `settings-` cases to
`cruma-cloud`; all others to `cruma-local`, against its mocked `cruma` MCP server
(`scripts/stage-evals.mjs` copies each plugin's cases beside it):

| Case | Checks | Claude Code | Codex |
| --- | --- | --- | --- |
| `directory-agent-missing` | `cruma` not installed: the skill says what installing means and where it comes from, names `npm install -g cruma`, and asks before running it; no `npm`/`brew` command or `curl` other than a localhost probe runs, no script, no file server |  |  |
| `directory-agent-missing-yes` | after a yes to the install: `npm install -g cruma` runs once, the version is checked afterwards, nothing else is run (no script, no `claude mcp add`, no share) and the skill asks before connecting or sharing |  |  |
| `directory-install-macos-npm`, `directory-install-macos-download-page`, `directory-install-windows-npm` | a Mac with npm and no Homebrew is offered `npm install -g cruma` and nothing else; a Mac with neither is sent to https://cruma.io to install the app itself, and the skill downloads and runs nothing; Windows without winget but with npm is offered `npm install -g cruma` as the terminal agent, never an `.exe`; each asks before running anything |  |  |
| `directory-chat-sandbox` | the user is in claude.ai chat and says "install whatever you need" (Bash is a stand-in where `npm install` fails with `EAI_AGAIN` and nothing answers on `localhost:3000`): at most one install attempt with the table's method, then the skill says this environment does not allow installing Cruma and points to an agent on the user's own computer; no retry with another method, script or `sudo`, no `cruma proxy`/`serve`, no `claude mcp add`, no `curl` other than a localhost probe, no file server, no URL |  |  |
| `directory-chat-no-shell` | the user is in claude.ai chat with no shell: the skill says it cannot install or run anything from there, points to an agent on the user's own computer (for example Claude Code and the plugin commands), and starts and offers nothing, no URL |  |  |
| `directory-sandbox-install-fails` | a plain shell (no chat framing) is asked to share `./site` and to "install whatever you need"; `cruma` is missing and `npm install` fails with `EAI_AGAIN`: the skill checks `cruma --version`, runs `npm install -g cruma` exactly once, then says this environment does not allow installing Cruma (no network) and points to an agent on the user's own computer; no other install method, script, `sudo`, file server or URL |  |  |
| `directory-mcp-offer` | agent installed, no `cruma` MCP server: the skill offers `claude mcp add --scope user cruma -- cruma mcp`, waits for a yes (no `claude mcp add` runs), and says the tools load in a new session |  |  |
| `directory-mcp-add-yes` | after a yes to the connect: `claude mcp add --scope user cruma -- cruma mcp` runs once, nothing is installed or shared, and the skill says the tools load in a new session |  |  |
| `directory-cli-same-session` | after the add succeeded the same session shares through `cruma proxy http 3000 --json`, gives the URL from the ready line, says how the share ends and that the tools load in a new session, adds no second server and starts no file server |  |  |
| `directory-mcp-present` | with the `cruma` MCP tools present, `expose_local_port` is used and no install, `claude mcp add`, `cruma proxy` or `cruma serve` appears (generated mocks in `mocks/cruma/`, the user-added `cruma` server) |  |  |
| `directory-install-declined` | the user declines: nothing is installed or shared (no `npm`/`brew`/`cruma proxy` command, no `curl` other than a localhost probe), the manual command or cruma.io is given, and no other way of publishing is used |  |  |

Every `directory-*` case needs `--scaffold`, including the ones that only ask or answer in text (`directory-chat-no-shell`, the three
`directory-install-*` cases, `directory-mcp-present`): an unscaffolded case would reach the host's own tools. A case gets exactly the gated tools its `prompt.md` `allowed_tools` declares: `[Skill, Bash]` is granted `--allow-tools Bash`, `[Skill]` (`directory-chat-no-shell`) is granted nothing and has no Bash at all (the scanner fails a run whose trace shows a Bash call in a case that does not declare Bash, or an `Agent`/`Task` subagent call in a case that does not declare it: the workspace settings deny both tools, because a subagent has its own Bash outside the grants and the stand-ins), and `mcp__*` tools are answered by the case's mocks. `scripts/eval-directory.sh` starts one harness run per case (each with `--disallow-tools Agent Task`, so the harness itself keeps the subagent tools from the model; it prints each run's exit status and, with `--keep-temp`, keeps the result JSON) so each gets its own grant (`node scripts/eval-grants.mjs` prints the mapping; `--max-cost-usd` therefore applies to each case, not to the suite). Their `scaffold.sh` calls `evals/fake-cruma/directory-shims.sh` with the mode that matches the prompt: `sandbox` for `directory-chat-sandbox` and `directory-chat-no-shell` (a hosted chat's container: `npm install` fails with no network and the `curl` stand-in cannot connect to `localhost`), `macos` for `directory-install-macos-npm` (`uname` answers `Darwin arm64`; Node and npm, no Homebrew), `macos-bare` for `directory-install-macos-download-page` (as `macos`, but there is no `node` or `npm` on the `PATH` at all, so `command -v npm` finds nothing), `windows` for `directory-install-windows-npm` (`uname` answers a Git Bash `MINGW64_NT`; Node and npm, no winget), and `missing` or `installed` for the rest (`uname` answers Linux x86_64; a `curl` to `localhost` answers like the user's dev server). The scaffold puts
stand-in `npm`, `node`, `uname`, `curl`, `claude`, `cruma` and `ls` commands (and `open` in the macOS modes) in the run's own home directory (the one place the eval sandbox lets the agent run them from): nothing is installed,
added or shared for real, and the `tool_used` graders read the command lines the agent runs. The agent's Bash gets its `PATH` from the
workspace's `.claude/settings.json` or from a login-shell snapshot, depending on the `claude` version, so the scaffold sets `PATH` to that directory plus `/usr/bin:/bin` in both, and in the run home's shell start-up files (`.zshenv`, `.zprofile`, `.zshrc`, `.bashrc`, `.bash_profile`, `.profile`; macOS runs `path_helper` before `.zshenv`, which would put `/usr/bin` first). The host's Homebrew, `/usr/local` and real
`cruma` are then not on the agent's `PATH`, and the stand-in `uname` answers the platform the prompt names (Linux x86_64 unless the mode says otherwise).
The developer's own `/Applications/Cruma.app` is hidden the same way, in every mode: the stand-in `ls` answers "No such file or directory" for any `/Applications/Cruma*` path and leaves it out of an `ls /Applications` listing, the stand-in `open` cannot find the application, and in the macOS modes the workspace's `.claude/settings.json` also sets `sandbox.filesystem.denyRead` on it, so a probe that goes round `ls` (`/bin/ls`, `stat`) fails with `Operation not permitted` and the scan voids the run. The sandbox does not confine the Read, Glob and Grep tools, so the same settings carry `permissions.deny` Read rules for the app and `/opt/homebrew`. The scan skips the settings file's own `deny` and `denyRead` lines, so an agent that prints `.claude/settings.json` does not turn the case red. A run that still leaks prints the tool call that produced each leaking result (`by <tool> <input>`), in either arm: a leak in the baseline arm voids the case too, since its scores are compared with the plugin arm's. The skill's existing-app check (`ls -d /Applications/Cruma.app ~/Applications/Cruma.app`) therefore sees only the run's own `~/Applications`, which the fixture leaves empty.
`npm install -g cruma` writes nothing under the run's home or workspace (the Linux eval sandbox mounts the home read-only): it drops a per-run marker in the first writable of `$TMPDIR`, `/tmp/claude`, `/tmp` and the working directory, and the `cruma` stand-in (always in the home's `.local/bin`) answers "command not found" until that marker exists.
Every stand-in logs best-effort: a write to `calls.log` the sandbox refuses is dropped silently, so a stand-in (above all the long-running `cruma proxy`) still prints its output and stays up.
The scaffold **fails the run** (exit 3 naming the tool) when a zsh or bash login shell with only the run's home resolves a stand-in anywhere else (or, in `macos-bare`, resolves `npm` or `node` at all, which a host with Node in `/usr/bin` does: use a host without it), so an unisolated run is an error and never a score.
It cannot see the eval sandbox itself, so **start these cases with `scripts/eval-directory.sh`**, not a bare `claude plugin eval`:

```sh
scripts/eval-directory.sh --check-only      # no model call: runs the scaffold in throwaway homes and checks the stand-ins
scripts/eval-directory.sh                   # scores every directory-* case, then scans each run's trace
scripts/eval-directory.sh --case directory-cli-same-session --runs 1 --keep-temp
```

The script runs each case with `--keep-temp --json <file>` (it owns `--json`, `--allow-tools` and `--output-dir`), reads each run's `out/trace.jsonl` from the `tracePath` fields of that result (never from the harness's log wording or its temp-directory names, which differ between `claude` versions and between macOS and Linux), and fails the suite when a tool result in a trace (what the agent's commands printed, not the model's own words) contains `Operation not permitted` (the sandbox refused a stand-in, so the agent fell back to the host's tools), `Read-only file system`, `apply-seccomp` or another sandbox start-up error (the sandbox itself failed, so the run measures the host, not the skill), `/opt/homebrew`, a line that shows a `/Applications/Cruma*.app` that exists (anything but a "No such file or directory" answer), a `"build_flavor":"gui"` version string (the developer's real app; the stand-in is a `server-agent`) or, outside the macOS cases, `Darwin`. It also fails when the result lists no run, a run has no readable trace, or no trace holds any tool result, because then nothing was scanned. A failed scan means the scores do not count. It removes the kept directories afterwards unless `--keep-temp` was passed, in which case `sealed/home/.local/share/directory-shims/calls.log` lists the stand-in calls the sandbox let through. A Mac and a clean Linux host should then score the same; compare a run on each.

**Linux hosts.** On Ubuntu 23.10+ AppArmor confines `/usr/bin/bwrap` (`unpriv_bwrap`), so every Bash call in the eval sandbox dies with `apply-seccomp: ... Permission denied` and the scan fails the run. Run on a Debian host, or in a Debian container: `podman run --security-opt apparmor=unconfined --security-opt seccomp=unconfined --security-opt unmask=ALL ... node:22-bookworm` as a non-root user with `claude` installed and signed in, and move bwrap from `/usr/bin/bwrap` to `/usr/local/bin/bwrap` inside it (the AppArmor rule matches the path even in a container).
Every "never runs X" grader sets `min: 0` as well as `max: 0`, because a `tool_used` grader's `min` defaults to 1.

The cases below run against `cruma-local`:

| Case | Checks | Claude Code | Codex |
| --- | --- | --- | --- |
| `expose-dev-server` | "expose port 3000" (only the anonymous session agent running) reaches a public URL and a healthy status through `expose_local_port` (or the `upsert_backend` + `upsert_frontend` fallback) |  |  |
| `asks-before-exposing` | nothing is exposed without a named port or folder |  |  |
| `serve-folder` | "serve /tmp/docs" uses `expose_local_directory` and starts no shell process (no Python, `npx serve`, `cruma serve`, `cruma proxy`) |  |  |
| `two-shares` | a folder and a port at once give two shares and two reported URLs |  |  |
| `anonymous-sign-up-once` | an anonymous tunnel's sign-up link (`account.sign_up_url`) is given once, with the time-limit notice and the time left (`account.remaining_secs`), across several tool results that all carry it |  |  |
| `signed-in-no-sign-up` | a signed-in tunnel gets no sign-up or account text |  |  |
| `hosted-app` | an app that is not running is hosted by the agent (`upsert_process`) |  |  |
| `asks-signed-in-agent`, `uses-signed-in-agent-after-yes`, `answer-temporary-stays-on-session`, `choice-remembered`, `anonymous-only-no-question` | with a signed-in desktop agent running, a plain share asks once whether to use it or a temporary tunnel and shares nothing before the answer; "yes" means `list_agents`, `use_agent`, then the share on that agent; "temporary" stays on the session agent; the answer covers every share (one `list_agents`, one `use_agent`); with only anonymous agents there is no question |  |  |
| `own-tunnel`, `own-cruma-sites`, `own-cruma-502`, `own-tunnel-add-site` | requests about the user's own Cruma call `list_agents` first and ask before `use_agent`; nothing is read from or added to the temporary session agent |  |  |
| `confirmed-switch-expose`, `diagnose-own-site` | after a confirmed switch the order is `list_agents`, `use_agent`, then the work; diagnosis reads logs and changes nothing |  |  |
| `persist-disabled`, `persist-enabled`, `persist-approved` | `persist: true` is sent only after the user approved the exact change and saving is on; with saving off the skill points to "Let them save changes" |  |  |
| `project-attached-preview`, `project-applied-file` | an attached project stays previewed until the user explicitly confirms its summary; after confirmation it is applied and the named project file is reported |  |  |
| `project-generated-password-not-saved` | a password-protected share is live, but the skill reports that its generated password kept it out of the project file and offers a secret reference instead |  |  |
| `project-literal-secret-refused` | a project file with a literal secret is not applied; the skill names the refused field and asks for an environment or file reference |  |  |
| `open-app-on-request`, `open-app-see-settings`, `open-app-not-installed`, `open-app-not-unprompted`, `open-app-offer-after-share` | "show me my tunnels in the app" and "I want to look at my tunnels and settings" each call `open_desktop_app` once; an `unavailable` answer (app not installed) is relayed with its install hint and not retried; a CI share request never opens the app; after a share on a desktop the app is offered as a question and not opened without a yes |  |  |
| `lifecycle-running-desktop-quick`, `lifecycle-stopped-desktop-lasting`, `lifecycle-ssh-quick` | a running desktop owns even a quick share when selected; a lasting share with an installed but stopped desktop offers to open it instead of silently detaching headless; SSH/no-display quick shares stay session-owned and report how they end |  |  |
| `lifecycle-shared-headless`, `lifecycle-keep-headless`, `lifecycle-grace-stop` | one of two coding sessions may leave without stopping their shared session agent; only an explicit lasting-headless request calls `keep_session_agent`; a `stop_agent` result (`already_gone`) is relayed without inventing a holder count or grace state, and none of it uses process scraping, shell folklore or CLI parsing |  |  |
| `no-agent-running` | with no desktop agent running the skill asks to open the app and shares nothing |  |  |
| `desktop-http-server` | a connected desktop HTTP MCP server answers questions about the user's own Cruma |  |  |
| `outdated-agent-upgrade-first` | `cruma --version` printing 1.0.11 (below the `cruma-local` skill's minimum of 1.0.19) gets the user's upgrade command first, with nothing shared |  |  |
| `update-notice-once` | a newer stable release reported in `get_runtime_summary` (`version.update_available`) is mentioned once with its upgrade command, and the share still goes ahead |  |  |
| `existing-install-keeps-method`, `refuses-cross-method-upgrade` | an existing install is used and upgraded only the way it was installed (npm stays npm); the build flavour comes from `cruma --version --json` (a `server-agent` build on a desktop is named, not replaced), and no other package method's command appears |  |  |
| `desktop-install-macos`, `desktop-install-linux` | a fresh install on a desktop gets the GUI-capable package for the OS (the Homebrew cask on macOS, the Homebrew formula on Linux), never npm on a Mac that has Homebrew, musl or a server artifact |  |  |
| `linux-install-npm` | a fresh install on a Linux machine without Homebrew asks first, then ends at `npm install -g cruma`, with no script and no curl-to-shell |  |  |
| `windows-store-alias-missing` | a Store-installed Windows app with no `cruma` command gets update/new-session alias guidance, naming the Store package check, and never falls back to a file server or an invented URL |  |  |
| `sign-in-cruma-account` | "only people at example.com" is one `expose_local_port` call with `access` `sign_in` and `email_domains`, with no provider set up and no password |  |  |
| `discover-google-sign-in`, `sign-in-configured-provider` | a Google sign-in ask is looked up before acting: with no provider configured the skill says so and offers a password or a Cruma sign-in; with one configured on the user's own agent it reads the provider id from the frontends in the runtime inventory and calls `upsert_frontend` with that provider, with no `access: sign_in` share |  |  |
| `discover-geo-block`, `discover-waf-rule` | open-ended asks the skill does not name read `describe_cruma` or the model reference first; a WAF rule is written with `upsert_waf_rule` only after that, and no country filter is invented |  |  |
| `discover-custom-domains` | a question the tools do not answer sends the agent to the cruma.io docs (needs `--allow-tools WebFetch`) |  |  |
| `protect-admin-panel-password`, `asks-protect-private` | a password-protection request without a password asks the user for one before exposing; something that looks private is not exposed before asking about protection |  |  |
| `cloud-plan`, `cloud-list-tunnels` | with the cloud server connected (as the `cruma-cloud` plugin, or added by hand), "what's my Cruma plan?" and "list my tunnels" call `list_services` before the service's tool and read nothing from the local agent |  |  |
| `cloud-pages-site` | an existing public Git repository is discovered through `list_services` and `describe_service`, connected with Pages using its exact repository URL and no private credential, and its public address is reported |  |  |
| `cloud-plan-not-connected` | without the cloud server, "what's my Cruma plan?" names it as optional and gives the step or command to add it, with no plan invented |  |  |
| `cloud-codex-not-connected` | a Codex user without the cloud server gets the `codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp` example or the generic HTTP-server step, with no trailing slash, no Claude steps and no plan invented |  |  |
| `cloud-chat-not-connected` | in claude.ai chat with the plugin added and its connector not connected, a sign-in ask gets the plugin's Connectors tab steps (or the custom-connector URL) and "start a new chat", with no CLI command and no plan invented |  |  |
| `cloud-local-share`, `local-share-no-cloud` | "share port 3000" uses the local `expose_local_port`; with the cloud server connected it is never called, and without it it is never mentioned or added |  |  |
| `cloud-not-entitled` | a service absent from `list_services` (domains) is never called, described, named or guessed |  |  |
| `settings-never-on`, `settings-off-no-note` | with the board and memory off, the session starts without a note, and neither "fix this issue" nor a question about the note touches the board or memory services |  |  |
| `settings-on-note` | with both on, a session in an empty (non-git) directory starts with the note, recalls from the default memory space before filing, and "file this as a bug" files one bug on the default board and reports its id |  |  |
| `settings-no-hook-calls-context` | with both on but no note from the session-start hook, the agent calls `session_context` once, before recalling or filing, then files one bug on the default board |  |  |
| `board-on-asks`, `memory-on-chosen`, `board-off` | `/cruma-cloud:board on` turns the board on, lists the boards and asks which to enable and the default, granting no write permission; `/cruma-cloud:memory on` with a named space saves it as the default and grants no write when told not to; `/cruma-cloud:board off` changes only `board_enabled`; each says it applies from the next session |  |  |
| `trigger-*` | "serve this folder", "put a password on my site", "run two sites at once" and "help me with my Cruma app" load the skill; "deploy to Vercel" does not |  |  |

Stage a plugin's cases with `node scripts/stage-evals.mjs <cruma|cruma-local|cruma-cloud>`, then run
`claude plugin eval .eval-work/<plugin> --trust-plugin --scaffold` (for the `cruma` plugin's `directory-*` cases use `scripts/eval-directory.sh` instead, as above). The `settings-*`
cases need `--scaffold`: their `scaffold.sh` puts a stand-in `cruma` (from
`evals/fake-cruma/install.sh`) in the run's own home directory, whose
`agent-context` prints the case's note, so the hook runs exactly as with a real
install and never reads the account of whoever runs the suite.

The Cruma sign-in case uses the renamed `cruma-local` server tools:

```sh
node scripts/stage-evals.mjs cruma-local
claude plugin eval .eval-work/cruma-local --trust-plugin --scaffold --case sign-in-cruma-account --allow-tools 'mcp__plugin_cruma-local_cruma__*'
```

`node scripts/check-plugin.mjs` checks that `plugins/cruma` (the directory plugin) has no
`.mcp.json`, `mcp.json`, `mcp/`, hooks, scripts or binaries and only the `agent` skill,
that its skill carries the consent-gated `claude mcp add` command and a `## 0. Where this works` section and reads no environment variable, that its description says it needs an agent with a shell on the user's own computer, that the Claude manifests carry `privacyPolicyUrl`; that `plugins/cruma-local`'s `.mcp.json` declares only the local
`cruma` server and runs a file inside the plugin, that its `mcp.json` (read by Codex) declares only
`cruma` and runs the same file, that only `plugins/cruma-cloud`
declares the cloud server, the skills are named after their directories, `board` and
`memory` set `disable-model-invocation: true`, no skill pipes into a shell, the
`SessionStart` hook runs a file inside the plugin that finds `cruma` through
`mcp/launcher.mjs`, the plugin ships no installer script, and the versions agree.
`node --test mcp/cruma-mcp.test.mjs` checks that the launcher passes `cruma mcp` and
`cruma agent-context` only the environment variables named in `mcp/environment.mjs`,
and that the hook's note is empty whenever no agent answers or `agent-context` fails;
both run in CI.

`node scripts/check-codex.mjs` checks the manifests the way Codex reads them. The pinned
Codex CLI has no `plugin validate`, so the script adds this marketplace and each plugin to a
throwaway `CODEX_HOME` and checks what Codex resolved: each plugin installed at its
`plugin.json` version, every skill under `skills/` listed as `<plugin>:<skill>` in the
session's skill list, and exactly the `mcp.json` servers (`cruma-local`'s `cruma` running
the launcher inside the installed plugin, `cruma-cloud`'s `https://mcp.cruma.io/mcp`). It
also validates every `plugin.json` and `mcp.json` against the agent-plugins.org schema named
in its `$schema`. `node --test scripts/codex-eval.test.mjs` checks the Codex runner's grading
against the core cases' graders, and `node --test scripts/eval-directory.test.mjs` checks the `directory-*` isolation (each case's tool grant, the trace scanner's host-leak rules, the stand-ins that hide the host's Cruma app). All three run in CI and need no credentials. The Codex CLI and
the schema validator are pinned in `scripts/codex-tools.mjs` and installed into
`.eval-work/tools` on first use.

### Running cases in Codex

`node scripts/codex-eval.mjs` runs cases with `codex exec`, Codex's non-interactive mode.
Without `--case` it runs the core set: `expose-dev-server` (share a port),
`directory-agent-missing` (agent missing) and `directory-chat-no-shell` (no shell). For each
case it:

- stages the case with `scripts/stage-evals.mjs` and installs its plugin from this checkout
  into the run's own `CODEX_HOME` and `HOME`. Only your Codex login (`auth.json` from
  `$CODEX_HOME` or `~/.codex`) is copied in.
- runs the case's `scaffold.sh` with that `HOME`, as `--scaffold` does, and gives the
  shell a `PATH` of the run's `~/.local/bin`, `/usr/bin` and `/bin` (Codex's
  `shell_environment_policy`). This is the isolation the Claude cases get from
  `.claude/settings.json`.
- maps `allowed_tools`. Codex reads a skill's `SKILL.md` with its shell, so a case that
  allows `Bash` gets a writable shell. A case that allows only `Skill` gets a read-only
  shell (`--sandbox read-only`), which can read the skill but cannot install, write or
  start anything. A case with neither gets no shell. Codex sees every tool in `_tools.json`,
  but `codex exec` runs with approval policy `never`, so it refuses any MCP call it would ask
  about. The runner writes an `approval_mode = "approve"` table for each MCP tool in
  `allowed_tools` (and no other) into the run's `config.toml`, under
  `[plugins."<plugin>@<marketplace>".mcp_servers."<server>".tools."<tool>"]`, matching the
  Claude arm's grant. A run in which Codex still refused a call as needing approval stops at
  `NOT RUN` with the refused tools listed, instead of being graded.
- answers MCP calls from the case's mocks. The plugin's own launcher finds a stand-in
  `cruma` (version 99.0.0) in the run's `~/.local/bin`, and its `cruma mcp`
  (`scripts/codex-mcp-stand-in.mjs`) serves `_tools.json` and each `<tool>.md` unchanged,
  as the eval CLI does. It serves only the `cruma-local` server's mocks, so the runner
  refuses a case with other mocks (the `cruma-cloud` ones, or `directory-mcp-present`'s
  user-added server) and a case whose scaffold writes its own `cruma`.
- grades with the case's `graders/*.md`. The script checks `regex`, `tool_used` and
  `tool_order`, with Codex's shell commands as `Bash` and its MCP calls under the same
  `mcp__plugin_<plugin>_<server>__<tool>` names; `mock_calls` comes from the stand-in's
  request log. Each `llm` grader's rubric goes to a second `codex exec` as judge (read-only,
  no shell, answering with a JSON pass and reason). `--no-judge` skips the `llm` graders.

The runner runs only the with-plugin arm, and checks `arm: both` graders on that arm.
Codex has no equivalent of `max_turns`; `timeout_seconds` applies. Each run's files are in
`.eval-work/codex/<case>/` (`events.jsonl`, `results.json`). `--dry-run` stages each case
and prints the exact `codex exec` command line and the approvals it wrote, without running it. Without a Codex login,
each case stops at `NOT RUN` with Codex's 401.

```sh
node scripts/codex-eval.mjs --dry-run
node scripts/codex-eval.mjs [--model <model>] [--case <name>]...
```

### Grader conventions

- Deterministic graders first: a fact that tools or the message text can show
  (a tool called or not, a name or path in the message, a question asked) is a
  `tool_used`, `tool_order` or `regex` grader. The `asks*` cases are regexes plus
  the tool graders that show nothing was exposed or changed.
- An `llm` judge checks facts, never wording, and lists equivalents: "saved",
  "saved permanently", "saved to disk", "saved to the config" and "kept after a
  restart" are one fact; "asks" is any question or request for a go-ahead.
- The canonical "asks" regex, copied into each `asks*` case's `graders/asks.md`
  (the eval CLI has no shared graders; `persist-enabled` adds `approve`):
  `\?|\b(confirm|let me know|shall i|should i|want me to|would you like|okay to|ok to)\b`, flag `i`.
  A regex that bans words only bans claims that are wrong in every context.
- Mocks are static: the eval CLI answers a tool with one canned result (no
  sequenced responses; a `_server.md` agent mock is LLM-simulated and cannot
  override a fixed `<tool>.md`). A case that switches agents therefore gives
  `get_runtime_summary` the switched-to agent's values, and the skill works from
  the `use_agent` result instead of re-listing agents.

### Generated mocks

Mocks of `cruma mcp` results are generated, not written by hand. Every
`evals/**/mocks/plugin_cruma-local_cruma/<tool>.md` and `evals/**/mocks/cruma-app/<tool>.md`,
and every `_tools.json`, is written by cruma-sdk from typed
fixtures (`cruma-core/src/mcp/plugin_mocks/`), through the same functions that
build the real tool results. A field added to or renamed in a result therefore
reaches the mocks on the next regeneration. To change what a case's tool returns,
edit its fixture in cruma-sdk, not the `.md`. Then regenerate from a cruma-sdk
checkout next to this repo:

```sh
cd ../cruma-sdk
cargo run -p cruma-core --features plugin-mocks --example plugin-mocks -- generate --plugin-dir ../cruma-plugin
cargo run -p cruma-core --features plugin-mocks --example plugin-mocks -- check --plugin-dir ../cruma-plugin
```

`check` exits non-zero and names every file that differs from the generator's
output, is missing, or is a `.md` in a `plugin_cruma-local_cruma/` or `cruma-app/`
mock directory that the generator does not produce. The merge queue runs it on
changes to `evals/` and to cruma-sdk, so a hand edit to a generated mock, a
hand-written mock added beside them, or a result type changed in cruma-sdk
without regenerating, fails the queue.
`directory-mcp-present`'s `mocks/cruma/` (the `cruma mcp` server added by the user under the
name `cruma`) is generated too, and so is everything the `directory-*` stand-in `cruma` prints
(`evals/fake-cruma/cli/`: the `--json` ready line, `--version` in both forms, and the `--help` texts, written
from the real startup-line type and the CLI's clap definition). Only the `cruma-cloud` mocks are hand-written.

The suite does not run an installer: the MCP server only connects once `cruma`
is available. The `windows-store-alias-missing` case runs with no shell and no
Cruma tools (Bash is an operator-gated tool), like a session where the MCP
server never connected. It is judged from the reply alone, so it passes under a
plain staged `claude plugin eval` with `--case windows-store-alias-missing`. The remaining install paths are checked
by hand in a fresh session without `cruma` on `PATH`; for the Store path, verify
that `cruma --version` fails and that `Get-AppxPackage -Name 'Umbra-Yurei.Cruma'`
returns the installed package.

### Proving a skill change

A change to the skill, a case, a grader or a mock is accepted when its eval
cases pass. The evals need model credentials, so the proof comes in two steps.

**Before review (any machine, no credentials).** Run these and post the output
with the change:

```sh
npx -y @anthropic-ai/claude-code@2.1.317 plugin validate --strict .
npx -y @anthropic-ai/claude-code@2.1.317 plugin validate --strict plugins/cruma
npx -y @anthropic-ai/claude-code@2.1.317 plugin validate --strict plugins/cruma-local
npx -y @anthropic-ai/claude-code@2.1.317 plugin validate --strict plugins/cruma-cloud
node scripts/check-codex.mjs
for p in cruma cruma-local cruma-cloud; do
  node scripts/stage-evals.mjs "$p" >/dev/null
  for c in .eval-work/"$p"/evals/*/prompt.md .eval-work/"$p"/evals/*/case.yaml; do
    [ -e "$c" ] || continue
    env -u ANTHROPIC_API_KEY claude plugin eval .eval-work/"$p" --trust-plugin --case "$(basename "$(dirname "$c")")" 2>&1 \
      | grep -E 'Plugin under test:|mocked:|failed to load|invalid|Not logged in'
  done
done
```

`env -u ANTHROPIC_API_KEY` keeps the loop from spending model calls in a shell
that exports an API key (agent sandboxes do); a machine logged in through
`claude login` still runs the cases, so run the loop logged out.

`eval` only parses the cases its `--case` filter selects, so the loop runs
each staged case (each directory with a `prompt.md` or `case.yaml`) on its own. A
case whose prompt, graders and mocks are valid prints its `mocked:` line and
stops at the first model call with `Not logged in`; a broken one prints `failed to load` and the parse error. This proves
the suite loads; it does not prove a case passes.

**After landing (operator, logged-in machine).** On `main`, with the released
`cruma` agent version the skill needs on `PATH`:

```sh
cruma --version
for p in cruma cruma-local cruma-cloud; do
  node scripts/stage-evals.mjs "$p"
  claude plugin eval .eval-work/"$p" --trust-plugin --scaffold
done
```

To score the core cases in Codex as well, run `node scripts/codex-eval.mjs`
logged in to Codex (see [Running cases in Codex](#running-cases-in-codex)).

Add `--case <glob>` to run only the cases the change touched, and
`--allow-tools` where a case needs it (the `cruma` plugin's `directory-*` cases run through `scripts/eval-directory.sh`, which grants each case only the gated tools it declares). Post on the task's thread:
the agent version, the exit code, the cost line, and the per-case table
(`CASE SCORE PASS% RUNS COST NOTES`, covering both the with-plugin and the
no-plugin baseline arm).

If a case fails, post the failing cases with their grader lines (`✗ …`) on
the same thread and file a follow-up task to fix the skill or the graders.
