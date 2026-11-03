# Cruma coding-agent plugin

This plugin gives coding agents a skill named `agent` (`cruma:agent` in Claude Code) for installing the Cruma tunnel
agent and publishing local things: a dev server port, a folder of files served
by the agent itself (no separate file server), an app the agent hosts for you,
or several named sites at once. The plugin ships no installer: on Linux the skill
offers `npm install -g cruma` or Homebrew after you confirm. A tunnel makes the selected local
service reachable at a public URL, so only expose a service after the user has
confirmed that it is safe to share. Tunnels can be anonymous: no account or
signup is required to start one.

## Codex and other skills-compatible agents

Install the included `skills/agent/SKILL.md` skill with:

```sh
npx skills add umbra-yurei/cruma-plugin
```

Then ask your agent to expose a local service, for example: “Expose my dev
server on port 3000.” The skill checks for the agent, installs it without
`sudo` when needed, asks for confirmation before making anything public, and
reports the public URL.

## Claude Code

The plugin also connects a local MCP server named `cruma` (`.mcp.json` runs
`node ${CLAUDE_PLUGIN_ROOT}/mcp/cruma-mcp.mjs`, a short launcher in this
repository that needs Node.js). The launcher starts `cruma mcp` from the `cruma`
installed on your machine (the macOS app, Homebrew, `/usr/local/bin`,
`~/.local/bin`, the Windows Store alias, then `PATH`; the newest wins) with its
own anonymous agent, and exposes nothing until Claude calls a tool that does.
It downloads nothing. When `cruma` is not installed, it prints how to install
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
credentials) it asks whether to protect it and suggests a password; sign-in
needs a sign-in provider configured on your own Cruma, otherwise it offers a
password.

When a signed-in Cruma of yours is running (the desktop app or a headless agent
with tunnel credentials), the skill asks once, before the first share, whether
to use it or a temporary anonymous tunnel, and keeps your answer for the
session. With no such agent running, or where it cannot ask, it uses the
temporary tunnel without a question and says so.

To work on your own running Cruma (the desktop app or a headless agent: its
sites, routes, processes and logs) instead of the temporary session tunnel,
ask for it; the skill lists your running agents and asks before switching to
one.

Add the marketplace, then install the plugin:

```sh
claude plugin marketplace add umbra-yurei/cruma-plugin
claude plugin install cruma@cruma-plugin
```

In Claude Code, ask to expose a local service, for example: “Expose my dev
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

## Updating

The plugin and the `cruma` agent update separately; updating one does not
change the other.

- **The plugin** (this skill): `claude plugin marketplace update cruma-plugin`,
  then `claude plugin update cruma@cruma-plugin`, and restart Claude Code.
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
  | Microsoft Store (Windows) | update Cruma in Microsoft Store |

  The skill upgrades an installed agent only with the command for its own
  install method, and installs the GUI-capable package on a desktop (the macOS
  cask, the Linux Homebrew formula, Microsoft Store; `npm install -g cruma` on Linux without Homebrew); it reads the build
  flavour from `cruma --version --json`.
  The skill needs agent 1.0.12 or newer. It checks `cruma --version`, and with
  the MCP tools connected it mentions a newer stable release once, from the
  `version` block of `get_runtime_summary`. Restart Claude Code after
  upgrading so the MCP server starts the new agent.

## Evals

`evals/` holds `claude plugin eval` cases that run against a mocked `cruma` MCP
server:

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
| `no-agent-running` | with no desktop agent running the skill asks to open the app and shares nothing |
| `desktop-http-server` | a connected desktop HTTP MCP server answers questions about the user's own Cruma |
| `outdated-agent-upgrade-first` | `cruma --version` printing 1.0.11 (below the skill's minimum of 1.0.12) gets the user's upgrade command first, with nothing shared |
| `update-notice-once` | a newer stable release reported in `get_runtime_summary` (`version.update_available`) is mentioned once with its upgrade command, and the share still goes ahead |
| `existing-install-keeps-method`, `refuses-cross-method-upgrade` | an existing install is used and upgraded only the way it was installed (npm stays npm); the build flavour comes from `cruma --version --json` (a `server-agent` build on a desktop is named, not replaced), and no other package method's command appears |
| `desktop-install-macos`, `desktop-install-linux` | a fresh install on a desktop gets the GUI-capable package for the OS (the Homebrew cask on macOS, the Homebrew formula on Linux), never npm on macOS, musl or a server artifact |
| `linux-install-npm` | a fresh install on a Linux machine without Homebrew asks first, then ends at `npm install -g cruma`, with no script and no curl-to-shell |
| `windows-store-alias-missing` | a Store-installed Windows app with no `cruma` command gets update/new-session alias guidance, naming the Store package check, and never falls back to a file server or an invented URL |
| `discover-google-sign-in`, `sign-in-configured-provider` | sign-in is looked up before acting: with no provider configured the skill says so and offers a password; with one configured on the user's own agent it reads the provider id from the frontends in the runtime inventory and calls `upsert_frontend` with that provider, with no `access: sign_in` retry |
| `discover-geo-block`, `discover-waf-rule` | open-ended asks the skill does not name read `describe_cruma` or the model reference first; a WAF rule is written with `upsert_waf_rule` only after that, and no country filter is invented |
| `discover-custom-domains` | a question the tools do not answer sends the agent to the cruma.io docs (needs `--allow-tools WebFetch`) |
| `protect-admin-panel-password`, `asks-protect-private` | a requested password goes through `access`, with the credential reported once; something that looks private is not exposed before asking about protection |
| `trigger-*` | "serve this folder", "put a password on my site", "run two sites at once" and "help me with my Cruma app" load the skill; "deploy to Vercel" does not |

Run them with `claude plugin eval . --trust-plugin`.

`node scripts/check-plugin.mjs` checks that `.mcp.json` runs a file inside the
plugin, the skill is named `agent` and pipes nothing into a shell, and the
versions agree. `node --test mcp/cruma-mcp.test.mjs` checks that the launcher
passes `cruma mcp` only the environment variables named in `mcp/environment.mjs`;
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

The suite does not run an installer: the MCP server only connects once `cruma`
is available. The `windows-store-alias-missing` case runs with no shell and no
Cruma tools (Bash is an operator-gated tool), like a session where the MCP
server never connected. It is judged from the reply alone, so it passes under a
plain `claude plugin eval . --trust-plugin`. The remaining install paths are checked
by hand in a fresh session without `cruma` on `PATH`; for the Store path, verify
that `cruma --version` fails and that `Get-AppxPackage -Name 'Umbra-Yurei.Cruma'`
returns the installed package.

### Proving a skill change

A change to the skill, a case, a grader or a mock is accepted when its eval
cases pass. The evals need model credentials, so the proof comes in two steps.

**Before review (any machine, no credentials).** Run both and post the output
with the change:

```sh
claude plugin validate --strict .
for c in evals/*/prompt.md evals/*/case.yaml; do
  [ -e "$c" ] || continue
  claude plugin eval . --trust-plugin --case "$(basename "$(dirname "$c")")" 2>&1 \
    | grep -E 'mocked:|failed to load|invalid|Not logged in'
done
```

`eval` only parses the cases its `--case` filter selects, so the loop runs
each case (each directory with a `prompt.md` or `case.yaml`) on its own. A
case whose prompt, graders and mocks are valid prints its `mocked:` line and
stops at the first model call with `Not logged in`; a broken one prints `failed to load` and the parse error. This proves
the suite loads; it does not prove a case passes.

**After landing (operator, logged-in machine).** On `main`, with the released
`cruma` agent version the skill needs on `PATH`:

```sh
cruma --version
claude plugin eval . --trust-plugin
```

Add `--case <glob>` to run only the cases the change touched, and
`--allow-tools` where a case needs it (see above). Post on the task's thread:
the agent version, the exit code, the cost line, and the per-case table
(`CASE SCORE PASS% RUNS COST NOTES`, covering both the with-plugin and the
no-plugin baseline arm).

If a case fails, post the failing cases with their grader lines (`✗ …`) on
the same thread and file a follow-up task to fix the skill or the graders.
