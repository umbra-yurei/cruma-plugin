---
name: agent
description: Use Cruma to put local things on a public HTTPS URL and manage them - a dev server port, a folder of files, several named sites at once, password, sign-in or IP protection, agent-hosted dev servers. Also for inspecting or changing the user's own running Cruma desktop or headless agent (sites, routes, processes, logs), and for installing Cruma. Anything beyond a plain share is looked up in Cruma's own docs first. Asks before exposing anything.
---

# Cruma tunnels

Use this skill when the user wants to publish something from their machine,
manage what Cruma already serves, or install or stop Cruma. Anything shared is
public: ask before sharing and say exactly which port or folder becomes
reachable. Anonymous tunnels need no signup.

## The user's Cruma account

Account features, including plan details, account tunnels and sites, board and
memory, come with the optional `cruma-cloud` plugin. Use its `cloud` skill for
those requests. Sharing a port or folder and the user's running agents stay on
the local `cruma` server.

## With the cruma MCP tools

This plugin starts `cruma mcp` through its launcher (`mcp/cruma-mcp.mjs`), a
local MCP server named `cruma` that runs the installed `cruma` binary. When its tools are in your tool list, use them, not
shell commands. The server starts with nothing exposed.

### Find out; do not guess

This file is a map, not the manual. For one plain share of a port or folder,
use the tools below. For anything else (auth, filters, domains, routing,
processes, rules, a setting you have not used), first read what Cruma says
about itself, then use the tool it points to:

1. The resource `cruma://about` (or `describe_cruma`): what Cruma can do and
   which tool does it. Then `get_config_model_reference` with a `section`
   (`middleware_model` for access control and request filters, `backend_kinds`,
   `listener_model`, `recommended_mcp_usage`; the whole reference is large) and
   `get_cruma_glossary` for terms. On the user's own agent (see below),
   `get_runtime_inventory` shows what is already configured. Load the schemas of the tools you will call.
2. If those do not cover it, the docs as Markdown: `https://cruma.io/llms.txt`,
   the chapter list `https://cruma.io/book/cruma-tunnels.md`, and any chapter
   at `https://cruma.io/book/cruma-tunnels/<chapter>.md`. They are written for
   the command line (`cruma serve`, `cruma proxy`): take what Cruma can do from
   them and apply it through the MCP tools.
3. For a CLI-only path, `cruma --help` and `cruma <command> --help`.

Shortcuts such as `expose_local_port` cover the common case. Whatever they do
not cover is done with the general `upsert_*` tools; never present a
shortcut's limits as Cruma's limits. If the reference and the docs do not
support what the user asked for, say so; do not invent a setting or a tool.

**Never serve things yourself.** Do not start `python3 -m http.server`,
`npx serve` or any other file server, and do not run `cruma serve` or
`cruma proxy`: with MCP connected they start a second agent with its own tunnel.

### Whose Cruma

The tools start attached to a **temporary session agent**: an anonymous tunnel
that your windows share and that holds nothing the user saved. It is not the
user's own Cruma.

**Before the first share in a session**, call `list_agents` once (it reads
nothing from any agent, so it is fine first). Look for a running agent that is
not the session agent and whose `tunnel_account` is `registered` (the desktop
app or a headless agent, signed in or with tunnel credentials). A running agent
with `tunnel_account` `anonymous` is not one.

- **One such agent runs: ask once, before sharing anything.** Name the choice
  with its kind, profile, domain and what the other option means, for example:
  "Use your running Cruma (desktop, profile `work`, `acme.tun.example.test`) or a
  temporary anonymous tunnel (random address, browser warning page, time-limited,
  gone with the session)?" Share nothing, and call no other tool that reads or
  changes an agent, until they answer. If several run, list them in the same
  question.
  - They pick their own: call `use_agent` on that agent (this is the
    confirmation **Ask before `use_agent`** asks for) and make every share of
    the session there. Mention the known limit when it applies: a share made on
    one agent of a tunnel that several agents serve is reachable only through
    that agent.
  - They pick the temporary tunnel: stay on the session agent.
  - Remember the answer for the rest of the session. Do not ask again for later
    shares, and do not call `list_agents` again for them. Ask again only if the
    user raises it.
- **No such agent runs** (none, or only anonymous ones such as the session
  agent): no question. Use the session agent as is and report the URLs.
- **You cannot ask** (a non-interactive run, or no way to get an answer): use
  the session agent, and say in the hand-off that you did, and that a running
  signed-in Cruma was available when `list_agents` showed one.
- The question is not needed when the user already named where the share goes
  ("on my desktop Cruma", "use a temporary tunnel"): follow that.

The shares stay session-owned and are withdrawn when the session ends; never
set `persist` for them.

When the request is about *their* Cruma (their
app, sites, routes, domains, processes or logs: "why does my site return 502?",
"add a password to my staging site", "what's running in my Cruma?"), or they
want to share through their own tunnel, a custom domain or a named profile,
call `list_agents`
**before any tool that reads or changes an agent** (`describe_cruma`, `cruma://about`,
`get_config_model_reference` and `get_cruma_glossary` are fine first). Reading the session agent answers about a
setup that is not theirs, so never read it for such a request. Listing or
creating the tunnels on their account is the account's (see above), not
`list_agents`'.

- **Ask before `use_agent`**, naming the agent's kind (desktop, headless),
  profile and domain, and wait for the answer. For a plain share, the question
  above is that ask; never switch without it. The share tools then work on that agent. Switching withdraws the shares you
  made on the previous one.
- **Before the switch, say only which agent you would switch to and ask.** Do
  not describe what either agent holds (the session agent's included), and do
  not state or hint at a cause, a diagnosis or what is configured, even when
  `list_agents` shows a process summary (a phase such as `Failed`) or site
  names: that is a listing, not a diagnosis. Name the target (kind, profile,
  domain), ask, say that nothing is changed until they answer, and stop.
  Diagnose after the switch, from the user's agent.
- `use_agent` never starts an agent. If none is running for what the user
  means, say so and ask them to open the desktop app, or run
  `cruma --profile <name>` (use the name `list_agents` gives for a stopped
  profile). Do not fall back to the temporary tunnel for a request about their
  own sites.
- **Say only what a tool returned.** `list_agents` lists the agents it knows;
  from it you may say which agents are running and their kind, profile and
  domain. Do not claim that profiles, sites, settings or an account exist or
  are missing unless a tool result says so (for example, never "no saved
  profiles turned up" or "nothing is configured").
- No `list_agents` among your tools means an older agent: use the temporary
  tunnel for shares and say a newer `cruma` is needed for the user's own
  (**Update** has the upgrade command).
- A Cruma HTTP MCP server already in the user's client (for example
  `cruma-app`) *is* their own agent. Use its tools for requests about their
  Cruma and this plugin's for temporary shares. If it failed to connect, say
  so rather than using the session agent. `list_agents` marks the agent that
  serves HTTP `/mcp`.

On the user's own agent, after they agreed to the switch:

- A successful `use_agent` result is the state of the agent you are now
  attached to (domain, frontends, processes, `allow_persistent_changes`). Work
  from it; do not call `list_agents` again just to confirm the switch.

- **Reading** is free: `get_health_summary`, `get_site_summary`,
  `get_proxy_routes`, `probe_route`, `get_process_logs`,
  `list_recorded_requests`.
- **Changes** apply to the running agent and are gone when it restarts. Say so.
- **Permanent changes** ("set up a site for good") need `persist: true`, and
  the agent refuses it unless the user turned on "Let them save changes"
  (`mcp.local_socket.allow_persistent_changes`; desktop MCP page, "Coding
  Agents on This Computer"). Never quietly make an in-memory change instead.
  Explain the setting and ask them to turn it on, or to make the change in the
  app. Once it is on (`allow_persistent_changes` is `true` in the `use_agent`
  result, or in `list_agents` before the switch),
  do **not** call a write tool with `persist: true` yet: first describe the
  exact change (frontend, backend, middleware) as your reply and ask whether to
  save it, saying plainly that it would be saved to disk in the agent's config
  and stay after a restart. Pass `persist: true` only after the user clearly approved that exact
  change: a yes to your description in a later turn, or, in the same message,
  an explicit approval that names the backend and the frontend by kind and name
  as a saved change ("I approve exactly this saved change: ..."). Asking for a
  "permanent" or "saved" site, even with a name and a path, is a request, not
  approval: describe the change and ask. Never re-send an existing setting
  with `persist: true` to make it permanent without the same approval. This is
  the only use of `persist`, and never on the session agent.

### Protect what looks private

Before exposing something that looks private (an admin UI, a database tool,
internal docs, a folder with credentials, `.env` files or personal data), ask
whether to protect it, and suggest a password. Wait for the answer; do not
expose first. If the user already asked for protection, do not ask again.

- A password or an IP allowlist: pass `access` to `expose_local_port` or
  `expose_local_directory` (the tool schema lists the types). A generated
  password is returned once. When the user wants a password they choose,
  ask them for it in chat and pass exactly what they typed as `password`;
  never invent one, never take one from a file, environment variable or
  keychain, and never write a `${secret:...}` reference yourself. In a project
  with a `cruma.toml` the agent stores a typed password on the user's computer
  and the file holds only its name; the result's `password_stored` says so.
  Tell the user "stored on this computer as NAME" and do not repeat the
  password. A generated password is for this session only and is not saved.
  If `project_file` says the share was not saved, relay the reason. Without an
  `access` argument in the schema (an
  older agent), build the site with `upsert_backend` and `upsert_frontend` and
  a `basic_auth` middleware; read `middleware_model` for its shape.
- Sign-in with a Cruma account: this is `access` `sign_in` on
  `expose_local_port` or `expose_local_directory`, one call and nothing else.
  Visitors sign in with their Cruma account, with no provider to set up and no
  frontend, backend or middleware to build, so never use `upsert_frontend`,
  `upsert_backend` or rules for it. "Only people who sign in with Cruma" is
  `{"type": "sign_in"}`; "only people at example.com" is
  `{"type": "sign_in", "email_domains": ["example.com"]}`. Narrow it with
  `emails`, `email_domains` and one `organization`; none of them means any
  verified Cruma account. `organization` needs the agent itself signed in to
  Cruma: on an anonymous agent the call fails with a typed error, so say so and
  offer `email_domains` or a password. The policy ends with the share. Only when
  the tool schema has no `sign_in` type (an older agent) say the agent needs
  updating; do not rebuild it by hand.
- Sign-in with Google, GitHub or another provider: `sign_in` does not cover it.
  It goes through `upsert_frontend` with an `oauth2` middleware that references
  a provider the user's own agent already has. Find the provider ids in the
  `oauth2` middlewares of existing frontends (`get_runtime_inventory` with
  `full: true` and `sections: ["frontends"]`), or ask the user which provider
  to use. Read `middleware_model` for the middleware's shape. If there is no
  provider, say that provider needs configuring first and offer sign-in with a
  Cruma account or a password.

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
`list_shares` to report every live URL. Once per session, also call
`get_runtime_summary` and read its `version` block (see **Versions** below).

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
   the user's app. When you used the session agent because you could not ask,
   say so.
5. For the session agent: the URLs end with the session, an anonymous tunnel
   also ends at its time limit (item 7), and nothing is written to disk. For
   the user's own agent: whether the change is temporary or saved.
6. How to take one down: ask you, and you call `unexpose` with its name for
   an `expose_*` share, or `remove_frontend`, `remove_backend` and
   `remove_process` for an `upsert_*` one. For a folder share, that editing
   the files updates the site immediately.
7. For a protected share: what protects it (password, allowed networks or
   sign-in), the credential once if you generated one (username `cruma`), where
   a password the user typed was stored (`password_stored`, never the password
   itself), and that the protection ends with the share. A share with no protection is
   public: say so.
8. The account notice, **once per session**, when a tool result's
   `account.state` is `anonymous`: the tunnel is anonymous and time-limited,
   with the time left from `account.remaining_secs` in hours and minutes
   (or `account.expires_at`) when the result carries it, and no number when
   it does not (never assume one), signing in to a free Cruma account keeps
   the same tunnel working past the limit, and the link `account.sign_up_url`,
   quoted exactly as given (one plain URL, written once). Every result
   carries the same block: once you have given the notice in this
   conversation, do not give it again, in this message or on later tool
   calls. When `account.state` is `signed_in`, say nothing about accounts or
   signing up.
9. The update notice, **once per session**, when `version.update_available` is
   `true`: the installed `version.installed_version`, the newer
   `version.latest_stable_version`, and `version.upgrade_hint` as given. Say
   nothing about versions when `update_available` is `false` or
   `latest_stable_version` is absent (offline).

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

First run `cruma --version`. If it succeeds, Cruma is already installed: use
that installation and check it against the minimum version below. If it is
missing, identify the user's platform before installing. On Windows, check for
the Store package before treating the command failure as a missing install:

```powershell
Get-AppxPackage -Name 'Umbra-Yurei.Cruma'
```

If that returns a package, Cruma is already installed. Do not install it again.
The installed version must contain the `cruma` command alias, and Windows may
need a newly opened terminal or Claude session before that alias is available.
Tell the user to update Cruma in Microsoft Store, then open a new terminal and
restart Claude. This branch is terminal: stop until `cruma --version` succeeds
or the MCP tools connect. Never start Python, Node, or another file server as a
workaround, and never claim or invent a public URL.

### Showing the desktop app

`open_desktop_app` opens the Cruma desktop app, or brings it forward when it is
already running, so the user can see their tunnels and settings. It is a
session tool: it does not need `use_agent` and changes nothing.

- Call it when the user asks to see, look at or review their tunnels, sites or
  settings; they do not have to name the app.
- After the first successful share on what looks like a desktop machine (the
  user is at a screen, not in CI or over SSH), offer it once in one sentence
  ("Want me to open the Cruma app so you can see it?") and call it only after
  a yes. One offer per session.
- Never call it unprompted, and never in CI, over SSH or in any headless or
  non-interactive session. If you cannot ask, do not open it.
- `status` is `opened` or `focused`: say so. `unavailable` carries a `reason`
  (`no_gui_in_this_build`, `no_display`, `not_installed`, `launch_failed`) and
  an `install_hint`: tell the user plainly, give the hint as the command for
  them to run, and do not retry or work around it. A terminal-only build is not
  replaced without the user's go-ahead (**An existing install**).
- No `open_desktop_app` among your tools means an older agent: say a newer
  `cruma` is needed, or ask the user to open the app themselves.

### An existing install

**Keep the install method.** Never install or upgrade an existing Cruma through
a different package method (a cask over an npm install, Homebrew over an npm install,
Winget over an installer copy, and so on): that leaves two `cruma` binaries on `PATH`
and the older one can win. Upgrade it the way it was installed (**Update**),
and if the method is not known, ask the user. Only the user may choose to
move to another method, and then you ask first.

**Read the build flavour from the typed response.** `cruma --version --json`
prints one JSON line, for example `{"version":"1.0.17","build_flavor":"gui"}`.
`build_flavor` is `gui` (the desktop application and its terminal command) or
`server-agent` (no desktop window). Read that field. Never work out the flavour
by parsing the human text of `cruma --version`, a file path or a package name.
If `cruma --version --json` does not print a JSON line (an older agent treats
`--json` as nothing and prints `cruma <version>`, or rejects it), the agent is
older than the field: treat the flavour as unknown, and that is not a reason to
reinstall.

On a machine with a desktop, a `server-agent` build means the user has no
Cruma window. Say so once, keep using it for shares, and do not replace it. Offer
no other package unprompted. Only when the user asks for the desktop app, name
the GUI-capable package for their OS (**Fresh install**), warn that the older
`cruma` must be removed or it may stay first on `PATH`, and wait for their
go-ahead.

When the user asks whether anything must be installed and their Cruma meets the
minimum version, the answer is no: say that they can use the installed one, say
what its build flavour means, and stop there. It names no install command of
any kind.

### Versions

The **minimum version is 1.0.12**: older agents lose sessions (for example the
second Claude window exits) and lack tools this skill uses. Take the version
from the `version` field of `cruma --version --json`. When no JSON line comes
back, read the `cruma <version>` line that `cruma --version` prints; that is
the only human text you read.

- **Older than 1.0.12:** before doing anything else, tell the user their Cruma
  is too old and give the upgrade command for their install method (see
  **Update**). Do not start a tunnel on it. Continue once they have upgraded
  and `cruma --version` shows 1.0.12 or newer.
- **1.0.12 or newer:** use it. With the MCP tools connected, a newer stable
  release shows up in `get_runtime_summary` as `version.update_available`
  (`version.latest_stable_version`, `version.upgrade_hint`); mention it once, as
  in the hand-off, and carry on. Never block a share on an optional update.
  Read it after a plain share, or on the user's own agent after a confirmed
  switch; never read the temporary session agent for a request about the
  user's own Cruma.

### Fresh install

Install only when `cruma --version` fails and no Windows Store package exists.
A desktop is present on macOS and Windows (unless the user says the machine is
remote or headless) and on Linux when `WAYLAND_DISPLAY` or `DISPLAY` is set.
On a desktop use the GUI-capable package for the OS:

| OS | Package |
| --- | --- |
| macOS | the Homebrew cask (the signed application); without `brew`, `npm install -g cruma` or the signed DMG (**macOS**) |
| Linux | the Homebrew formula (the glibc build, GUI-capable) when `brew` is installed |
| Windows | Microsoft Store |

Never recommend a musl or server-agent artifact, or a direct download of a
binary, for a desktop. (The signed, notarized macOS DMG below is an application
that is verified before it is copied, not a bare binary.) Without a desktop (a server, container or SSH session)
the Linux section below applies as well.

#### macOS

Apple Silicon only. There is no Intel Mac build yet (`uname -m` prints
`x86_64` on one): say so and install nothing. First look for an existing app
(`ls -d /Applications/Cruma.app ~/Applications/Cruma.app`): if there is one,
Cruma is installed and `cruma` is just not on `PATH`; install nothing and use
its `Contents/MacOS/cruma` by full path (step 7 below).

Offer exactly one method, chosen by what the Mac has (`command -v brew`,
`command -v npm`), and mention no other. When you cannot run commands and the
user says nothing about Homebrew, offer the first row.

| The Mac has | Your reply |
| --- | --- |
| `brew` | `brew install --cask umbra-yurei/brew/cruma`, the signed and notarized application. Use `--cask`: the formula with the same name is Linux-only. |
| `npm`, no `brew` | `npm install -g cruma`, the terminal agent (no `sudo` with a user-level npm prefix). Read `build_flavor` from `cruma --version --json` afterwards; if it is `server-agent`, say in one line that this build has no desktop window. If they want the desktop app, offer the signed DMG as their own choice, ask first, and tell them to run `npm uninstall -g cruma` before it. |
| neither | the signed, notarized DMG, installed as `Cruma.app` (below). |

**Signed DMG** (after a yes, never over an existing install):

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
8. Ask whether to open the desktop window; open it (`open_desktop_app`, or
   `open -a Cruma`) only after a yes. Then run `cruma --version --json` (the
   full path) and report the version it prints.

**Always end the reply with a question** ("Shall I run it?"), as for Linux
below.

#### Linux

Offer exactly one command, chosen by what the machine has, and mention no other
install method, package manager or command.

| The machine has | Your reply |
| --- | --- |
| `brew` | the command `brew install umbra-yurei/brew/cruma` and that it installs the glibc build, which is GUI-capable (the one for a desktop). Nothing else: no alternative, no fallback, no terminal-only variant. |
| `npm`, no `brew` | the command `npm install -g cruma` and that it installs the terminal agent for x86_64 and arm64 (no `sudo` with a user-level npm prefix, no desktop window). |
| neither | none; point the user to https://cruma.io for the install methods, and stop. |

Someone who wants a desktop window on a machine with `npm` but no `brew` is
pointed to https://cruma.io. Never run two commands.

**Always end the reply with a question.** When the user asked you to install it,
ask whether to go ahead ("Shall I run it?"), and run it
only after they say yes. The user's description of their machine is the machine
you act for: do not discuss whether your own shell is on it. When they will run
the command themselves, or you cannot run it, give it anyway and still end by
asking whether they want to go ahead or need anything else.

#### Windows

Find the current Microsoft Store product ID:

```powershell
winget search Cruma --source msstore
```

Then install the matching product ID with:

```powershell
winget install --id <StoreProductId> --source msstore --accept-package-agreements --accept-source-agreements
```

If Winget or its Microsoft Store source is unavailable and `npm` is installed,
offer exactly `npm install -g cruma` instead, and say it is the terminal agent
(x64) and that the desktop app comes from the [Cruma Microsoft Store
listing](https://apps.microsoft.com/detail/9NXKT3W34HVL). Without `npm`, use the
Store application or that listing. Do not suggest a direct Windows installer or
`.exe` download.

#### With Node.js

Never mention this when a Homebrew command or the Store above applies. Only when
none of the above fits, or the user already uses npm for Cruma, and
`npx` is available: `npx -y cruma proxy http
<port> --json` runs the agent without installing it (Linux x86_64 and arm64,
macOS Apple Silicon, Windows x64; not on other systems).

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

If the Windows Store package is installed but `cruma` is unavailable, do not
run this shell fallback at all. Explain the update/new-session alias steps from
**Detect and install**, then stop until `cruma --version` succeeds or MCP is
available. In particular, do not start an ad-hoc file server for a folder and
do not report a public URL.

To stop a tunnel started with `cruma proxy`, end that background process (for
example, send it Ctrl-C in the terminal where it runs, or stop the process
started for this request). Tell the user that the public URL stops working once
the process ends.

## Update

Updating the plugin and updating the `cruma` agent are separate: a new plugin
does not change the installed agent. Upgrade the agent the way it was
installed. With the MCP tools connected, `version.installed_via` and
`version.upgrade_hint` in `get_runtime_summary` already name the command; use
it as given. Otherwise pick by how Cruma was installed:

| Installed with | Upgrade |
| --- | --- |
| Homebrew cask (macOS) | `brew upgrade --cask umbra-yurei/brew/cruma` |
| Homebrew formula (Linux) | `brew upgrade umbra-yurei/brew/cruma` |
| A Linux installer script (`~/.local/bin/cruma`) | run the installer you used again (see https://cruma.io); the plugin ships none |
| npm install | `npm update -g cruma` |
| Signed DMG (macOS) | quit Cruma, then repeat the signed DMG steps of **macOS** (same checks) and replace `Cruma.app` |
| `npx -y cruma` | run the same `npx -y cruma` command again (it fetches the newest release) |
| Microsoft Store (Windows) | update Cruma in Microsoft Store, then open a new terminal and restart Claude |

Give the command of the row for the install the user has, exactly as the row
writes it and in a code block, even when you offer to run it. Name no other
row's command, not even to say it is not used, and not when that package is newer
or has a desktop window (**An existing install**). If the method is not known,
ask the user; do not guess one. After upgrading,
the running MCP server keeps the old agent until the Claude session is
restarted. Tell the user to restart it.

## Environments without a shell

In Claude.ai chat, Cowork, or another environment that cannot run shell
commands, explain the appropriate install and `cruma proxy http <port> --json`
commands for the user's platform. Tell the user to run them locally, to approve
the public exposure before running the proxy command, and to share the JSON
output if they want help identifying the public URL.
