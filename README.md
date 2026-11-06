# Cruma coding-agent plugins

This marketplace has three plugins. All of them let a coding agent put a dev
server port or a folder on a public Cruma URL. A tunnel makes the selected
local service reachable by anyone, so the skills share something only after the
user has confirmed it. Tunnels can be anonymous: no account is needed.

| Plugin | What it is | Who it is for |
| --- | --- | --- |
| `cruma` | Skill only: no MCP server, no hooks, no scripts. Submitted to Anthropic's plugin directory. | Everyone; install this one from the directory |
| `cruma-local` | The same skill plus a bundled local MCP server (`mcp/launcher.mjs` starts `cruma mcp`), for Claude Code (`.mcp.json`) and Codex (`mcp.json`). Never submitted to the directory. | People who want the tools from the first session, with no `claude mcp add` step |
| `cruma-cloud` | Optional hosted MCP server for your Cruma account. | People who ask about their plan, tunnels and sites |

## The `cruma` plugin (skill only)

```sh
claude plugin marketplace add umbra-yurei/cruma-plugin
claude plugin install cruma@cruma-plugin
```

The skill (`cruma:agent`) works in three steps and asks before each of the
first two:

1. **Install.** It runs `cruma --version`. When the agent is missing it says
   what installing means and where the program comes from, names the one method,
   and runs it only after a yes. On a Mac it is the Homebrew cask, else
   `npm install -g cruma`, else the signed, notarized DMG (the skill reads the release
   manifest, checks the code signature, notarization and signing team, and only then
   copies `Cruma.app`; nothing is installed when a check fails). Linux uses Homebrew,
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

The skill needs agent 1.0.12 or newer. Codex and other skills-compatible
agents can use the same skill: `npx skills add https://github.com/umbra-yurei/cruma-plugin/tree/main/plugins/cruma`
(the repository holds two skills named `agent`, one in `plugins/cruma` and one in
`plugins/cruma-local`, so the command names the `cruma` plugin's directory), and
`codex mcp add cruma -- cruma mcp` to connect the tools.

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

Or add the server by hand: `claude mcp add --transport http cruma-cloud
https://mcp.cruma.io/mcp`, or `codex mcp add cruma-cloud --url
https://mcp.cruma.io/mcp`. With it connected, the skill starts account
questions with `list_services` and `describe_service`; without it, it says the
server is optional and gives these commands.

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

At session start, the cloud plugin's `SessionStart` hook (`plugins/cruma-cloud/hooks/hooks.json`) runs
`cruma agent-context` through its bundled launcher (`mcp/launcher.mjs`) and adds what it prints to the
session. It prints a short note naming the boards and memory to use only when
one of them is on and the `cruma` on this machine is signed in to the account
(`cruma auth login`); with both off, no `cruma`, no sign-in or an agent older
than the command, the session gets nothing. Clients without hooks, such as
Codex, call `session_context` on `cruma-cloud` once at session start instead.

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
  | Signed DMG (macOS) | repeat the signed DMG steps (same checks) and replace `Cruma.app` |
  | Microsoft Store (Windows) | update Cruma in Microsoft Store |

  The skill upgrades an installed agent only with the command for its own
  install method, and installs the GUI-capable package on a desktop (the macOS
  cask, the Linux Homebrew formula, Microsoft Store; `npm install -g cruma` on Linux, or a Mac or Windows PC, without the first choice; the signed DMG on a Mac with neither Homebrew nor npm); it reads the build
  flavour from `cruma --version --json`.
  The skill needs agent 1.0.12 or newer. It checks `cruma --version`, and with
  the MCP tools connected it mentions a newer stable release once, from the
  `version` block of `get_runtime_summary`. Restart Claude Code after
  upgrading so the MCP server starts the new agent.

## Evals

`evals/` holds `claude plugin eval` cases. `directory-*` cases belong to the
skill-only `cruma` plugin; `board-`, `cloud-`, `memory-` and `settings-` cases to
`cruma-cloud`; all others to `cruma-local`, against its mocked `cruma` MCP server
(`scripts/stage-evals.mjs` copies each plugin's cases beside it):

| Case | Checks |
| --- | --- |
| `directory-agent-missing` | `cruma` not installed: the skill says what installing means and where it comes from, names `npm install -g cruma`, and asks before running it; no `npm`/`brew`/`curl` command runs, no script, no file server |
| `directory-agent-missing-yes` | after a yes to the install: `npm install -g cruma` runs once, the version is checked afterwards, nothing else is run (no script, no `claude mcp add`, no share) and the skill asks before connecting or sharing |
| `directory-install-macos-npm`, `directory-install-macos-dmg`, `directory-install-windows-npm` | a Mac with npm and no Homebrew is offered `npm install -g cruma` and nothing else; a Mac with neither is offered the signed DMG, with the signature and notarization checks named; Windows without winget but with npm is offered `npm install -g cruma` as the terminal agent, never an `.exe`; each asks before running anything |
| `directory-install-macos-dmg-bad-signature` | after a yes to the DMG install, `codesign --verify` fails (stand-ins from `evals/fake-cruma/mac-dmg-shims.sh`): the image is detached and the download deleted, `ditto` never runs, no other method is tried, and the reply says nothing was installed |
| `directory-mcp-offer` | agent installed, no `cruma` MCP server: the skill offers `claude mcp add --scope user cruma -- cruma mcp`, waits for a yes (no `claude mcp add` runs), and says the tools load in a new session |
| `directory-mcp-add-yes` | after a yes to the connect: `claude mcp add --scope user cruma -- cruma mcp` runs once, nothing is installed or shared, and the skill says the tools load in a new session |
| `directory-cli-same-session` | after the add succeeded the same session shares through `cruma proxy http 3000 --json`, gives the URL from the ready line, says how the share ends and that the tools load in a new session, adds no second server and starts no file server |
| `directory-mcp-present` | with the `cruma` MCP tools present, `expose_local_port` is used and no install, `claude mcp add`, `cruma proxy` or `cruma serve` appears (generated mocks in `mocks/cruma/`, the user-added `cruma` server) |
| `directory-install-declined` | the user declines: nothing is installed or shared (no `npm`/`brew`/`curl`/`cruma proxy` command), the manual command or cruma.io is given, and no other way of publishing is used |

The `directory-*` cases that run commands (all except `directory-mcp-present` and the three
`directory-install-*` cases that only ask) need
`--scaffold --allow-tools Bash`. Their `scaffold.sh` calls `evals/fake-cruma/directory-shims.sh` (the Mac DMG case calls
`mac-dmg-shims.sh`, with stand-in `curl`, `hdiutil`, `codesign`, `spctl`, `ditto` and a Darwin `uname`), which puts
stand-in `npm`, `node`, `uname`, `claude` and `cruma` commands in the run's own home directory: nothing is installed,
added or shared for real, and the `tool_used` graders read the command lines the agent runs. The agent
runs Bash as you with no OS sandbox, so the scaffold also writes the eval workspace's `.claude/settings.json`
with `env.PATH` set to that directory plus `/usr/bin:/bin`; the host's Homebrew, `/usr/local` and real
`cruma` are then not on the agent's `PATH`, and the stand-in `uname` answers Linux x86_64 like the prompts say.
A scored run is only meaningful with that isolation in place: check with `--keep-temp` that the workspace
has the `.claude/settings.json` and that no trace shows `/opt/homebrew`, a real `cruma` version or `Darwin`.
Every "never runs X" grader sets `min: 0` as well as `max: 0`, because a `tool_used` grader's `min` defaults to 1.

The cases below run against `cruma-local`:

| Case | Checks |
| --- | --- |
| `expose-dev-server` | "expose port 3000" (only the anonymous session agent running) reaches a public URL and a healthy status through `expose_local_port` (or the `upsert_backend` + `upsert_frontend` fallback) |
| `asks-before-exposing` | nothing is exposed without a named port or folder |
| `serve-folder` | "serve /tmp/docs" uses `expose_local_directory` and starts no shell process (no Python, `npx serve`, `cruma serve`, `cruma proxy`) |
| `two-shares` | a folder and a port at once give two shares and two reported URLs |
| `anonymous-sign-up-once` | an anonymous tunnel's sign-up link (`account.sign_up_url`) is given once, with the time-limit notice and the time left (`account.remaining_secs`), across several tool results that all carry it |
| `signed-in-no-sign-up` | a signed-in tunnel gets no sign-up or account text |
| `hosted-app` | an app that is not running is hosted by the agent (`upsert_process`) |
| `asks-signed-in-agent`, `uses-signed-in-agent-after-yes`, `answer-temporary-stays-on-session`, `choice-remembered`, `anonymous-only-no-question` | with a signed-in desktop agent running, a plain share asks once whether to use it or a temporary tunnel and shares nothing before the answer; "yes" means `list_agents`, `use_agent`, then the share on that agent; "temporary" stays on the session agent; the answer covers every share (one `list_agents`, one `use_agent`); with only anonymous agents there is no question |
| `own-tunnel`, `own-cruma-sites`, `own-cruma-502`, `own-tunnel-add-site` | requests about the user's own Cruma call `list_agents` first and ask before `use_agent`; nothing is read from or added to the temporary session agent |
| `confirmed-switch-expose`, `diagnose-own-site` | after a confirmed switch the order is `list_agents`, `use_agent`, then the work; diagnosis reads logs and changes nothing |
| `persist-disabled`, `persist-enabled`, `persist-approved` | `persist: true` is sent only after the user approved the exact change and saving is on; with saving off the skill points to "Let them save changes" |
| `open-app-on-request`, `open-app-see-settings`, `open-app-not-installed`, `open-app-not-unprompted`, `open-app-offer-after-share` | "show me my tunnels in the app" and "I want to look at my tunnels and settings" each call `open_desktop_app` once; an `unavailable` answer (app not installed) is relayed with its install hint and not retried; a CI share request never opens the app; after a share on a desktop the app is offered as a question and not opened without a yes |
| `no-agent-running` | with no desktop agent running the skill asks to open the app and shares nothing |
| `desktop-http-server` | a connected desktop HTTP MCP server answers questions about the user's own Cruma |
| `outdated-agent-upgrade-first` | `cruma --version` printing 1.0.11 (below the skill's minimum of 1.0.12) gets the user's upgrade command first, with nothing shared |
| `update-notice-once` | a newer stable release reported in `get_runtime_summary` (`version.update_available`) is mentioned once with its upgrade command, and the share still goes ahead |
| `existing-install-keeps-method`, `refuses-cross-method-upgrade` | an existing install is used and upgraded only the way it was installed (npm stays npm); the build flavour comes from `cruma --version --json` (a `server-agent` build on a desktop is named, not replaced), and no other package method's command appears |
| `desktop-install-macos`, `desktop-install-linux` | a fresh install on a desktop gets the GUI-capable package for the OS (the Homebrew cask on macOS, the Homebrew formula on Linux), never npm on a Mac that has Homebrew, musl or a server artifact |
| `linux-install-npm` | a fresh install on a Linux machine without Homebrew asks first, then ends at `npm install -g cruma`, with no script and no curl-to-shell |
| `windows-store-alias-missing` | a Store-installed Windows app with no `cruma` command gets update/new-session alias guidance, naming the Store package check, and never falls back to a file server or an invented URL |
| `sign-in-cruma-account` | "only people at example.com" is one `expose_local_port` call with `access` `sign_in` and `email_domains`, with no provider set up and no password |
| `discover-google-sign-in`, `sign-in-configured-provider` | a Google sign-in ask is looked up before acting: with no provider configured the skill says so and offers a password or a Cruma sign-in; with one configured on the user's own agent it reads the provider id from the frontends in the runtime inventory and calls `upsert_frontend` with that provider, with no `access: sign_in` share |
| `discover-geo-block`, `discover-waf-rule` | open-ended asks the skill does not name read `describe_cruma` or the model reference first; a WAF rule is written with `upsert_waf_rule` only after that, and no country filter is invented |
| `discover-custom-domains` | a question the tools do not answer sends the agent to the cruma.io docs (needs `--allow-tools WebFetch`) |
| `protect-admin-panel-password`, `asks-protect-private` | a requested password goes through `access`, with the credential reported once; something that looks private is not exposed before asking about protection |
| `cloud-plan`, `cloud-list-tunnels` | with the cloud server connected (as the `cruma-cloud` plugin, or added by hand), "what's my Cruma plan?" and "list my tunnels" call `list_services` before the service's tool and read nothing from the local agent |
| `cloud-plan-not-connected` | without the cloud server, "what's my Cruma plan?" names it as optional and gives the command to add it, with no plan invented |
| `cloud-local-share`, `local-share-no-cloud` | "share port 3000" uses the local `expose_local_port`; with the cloud server connected it is never called, and without it it is never mentioned or added |
| `cloud-not-entitled` | a service absent from `list_services` (domains) is never called, described, named or guessed |
| `settings-never-on`, `settings-off-no-note` | with the board and memory off, the session starts without a note, and neither "fix this issue" nor a question about the note touches the board or memory services |
| `settings-on-note` | with both on, a session in an empty (non-git) directory starts with the note, recalls from the default memory space before filing, and "file this as a bug" files one bug on the default board and reports its id |
| `board-on-asks`, `memory-on-chosen`, `board-off` | `/cruma-cloud:board on` turns the board on, lists the boards and asks which to enable and the default, granting no write permission; `/cruma-cloud:memory on` with a named space saves it as the default and grants no write when told not to; `/cruma-cloud:board off` changes only `board_enabled`; each says it applies from the next session |
| `trigger-*` | "serve this folder", "put a password on my site", "run two sites at once" and "help me with my Cruma app" load the skill; "deploy to Vercel" does not |

Stage a plugin's cases with `node scripts/stage-evals.mjs <cruma|cruma-local|cruma-cloud>`, then run
`claude plugin eval .eval-work/<plugin> --trust-plugin --scaffold` (add `--allow-tools Bash` for the `cruma` plugin's `directory-*` cases). The `settings-*`
cases need `--scaffold`: their `scaffold.sh` puts a stand-in `cruma` (from
`evals/fake-cruma/install.sh`) in the run's own home directory, whose
`agent-context` prints the case's note, so the hook runs exactly as with a real
install and never reads the account of whoever runs the suite.

The built-in Cruma sign-in case uses the renamed `cruma-local` server tools:

```sh
node scripts/stage-evals.mjs cruma-local
claude plugin eval .eval-work/cruma-local --trust-plugin --scaffold --case sign-in-cruma-account --allow-tools 'mcp__plugin_cruma-local_cruma__*'
```

`node scripts/check-plugin.mjs` checks that `plugins/cruma` (the directory plugin) has no
`.mcp.json`, `mcp.json`, `mcp/`, hooks, scripts or binaries and only the `agent` skill,
that its skill carries the consent-gated `claude mcp add` command; that `plugins/cruma-local`'s `.mcp.json` declares only the local
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
`evals/**/mocks/plugin_cruma_cruma/<tool>.md` and `evals/**/mocks/cruma-app/<tool>.md`,
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
output, is missing, or is a `.md` in a `plugin_cruma_cruma/` or `cruma-app/`
mock directory that the generator does not produce. The merge queue runs it on
changes to `evals/` and to cruma-sdk, so a hand edit to a generated mock, a
hand-written mock added beside them, or a result type changed in cruma-sdk
without regenerating, fails the queue. The generator writes the directory `plugin_cruma_cruma`; staging renames it to
`plugin_cruma-local_cruma`, the name the eval CLI expects for `cruma-local`'s server.
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
claude plugin validate --strict .
claude plugin validate --strict plugins/cruma
claude plugin validate --strict plugins/cruma-local
claude plugin validate --strict plugins/cruma-cloud
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

Add `--case <glob>` to run only the cases the change touched, and
`--allow-tools` where a case needs it (`--allow-tools Bash` for the `cruma` plugin's `directory-*` cases). Post on the task's thread:
the agent version, the exit code, the cost line, and the per-case table
(`CASE SCORE PASS% RUNS COST NOTES`, covering both the with-plugin and the
no-plugin baseline arm).

If a case fails, post the failing cases with their grader lines (`✗ …`) on
the same thread and file a follow-up task to fix the skill or the graders.
