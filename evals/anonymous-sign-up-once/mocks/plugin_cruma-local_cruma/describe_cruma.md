{
  "schema_version": "2026-04-22",
  "kind": "cruma.description",
  "name": "Cruma Tunnel Agent",
  "summary": "Cruma is a local tunnel and reverse-proxy agent. It maintains outbound connections to the Cruma control plane / ingress, receives tunneled traffic, terminates or forwards it locally, and routes it to configured services, directories, or hosted processes.",
  "what_the_agent_does": [
    "Maintains live transport connections to Cruma ingress using QUIC and/or HTTP/2.",
    "Tracks runtime tunnel state such as assigned public domain, tunnel plan, transport health, and listener status.",
    "Owns local listeners like http, https, and cruma ingress surfaces.",
    "Routes incoming traffic using frontends and backends.",
    "Can supervise local child processes and route traffic to them."
  ],
  "what_this_mcp_service_is_for": [
    "Expose authoritative live runtime state to AI clients.",
    "Help with orientation and troubleshooting by returning the same runtime state the GUI/TUI can see.",
    "Provide a foundation for diagnostic and control tools such as process inspection, logs, listener diagnostics, and backend validation.",
    "Run as an embeddable Hyper service mounted by an existing HTTP pipeline rather than binding its own socket."
  ],
  "this_agent": "You are attached to a temporary session agent: an anonymous tunnel, nothing it holds is saved, and your shares end with the session. It is not the user's own Cruma. If the user asks about their Cruma (sites, routes, processes, the app), call `list_agents` and ask before `use_agent`; do not diagnose their setup from this agent. If `list_agents` is not among your tools, the user's own agent can only be reached from here with a newer cruma.",
  "account": {
    "state": "anonymous",
    "sign_up_url": "https://dash.cruma.io/?ref=agent-mcp&client=claude-code",
    "expires_at": "2026-11-02T14:30:00Z",
    "remaining_secs": 9000
  },
  "capabilities": [
    {
      "goal": "make a local port reachable on the internet",
      "tools": [
        "expose_local_port"
      ],
      "note": "Returns the public URL, <name>.<assigned domain>. The share is public unless you set `access`."
    },
    {
      "goal": "publish a folder (static site, files)",
      "tools": [
        "expose_local_directory"
      ],
      "note": "The agent serves the folder itself: do not start another file server. Listings are off unless `index` is true."
    },
    {
      "goal": "serve several sites or ports at once, each under its own name",
      "tools": [
        "expose_local_port",
        "expose_local_directory"
      ],
      "note": "Call once per name. Every share lives at <name>.<assigned domain> and they all stay up together."
    },
    {
      "goal": "put a password, IP allowlist or sign-in in front of a share",
      "tools": [
        "expose_local_port",
        "expose_local_directory"
      ],
      "note": "Set `access` to one of `password`, `ip_allowlist`, `sign_in` when you expose. `sign_in` makes visitors sign in with their Cruma account, with no provider to set up; narrow it with `emails`, `email_domains` and one `organization` (none means any verified account). `organization` needs a signed-in agent and answers with a typed error on an anonymous one. The policy ends with the share, when the session closes."
    },
    {
      "goal": "put other auth (any middleware) in front of a site",
      "tools": [
        "upsert_backend",
        "upsert_frontend",
        "get_config_model_reference"
      ],
      "note": "For anything `access` cannot express, build the site yourself: `upsert_backend` (kind `local-directory` for a folder, `http` for a port), then `upsert_frontend` with the single label <name> as hostname, `listener_kinds` set to the `cruma` binding and a `basic_auth` or `ip_filter` middleware. Read the `middleware_model` section of `get_config_model_reference` first."
    },
    {
      "goal": "run a dev server or app and keep it running",
      "tools": [
        "upsert_process",
        "start_process"
      ],
      "note": "The agent supervises the process and routes a frontend to it with `process_id`, so do not start it in the background yourself. Read its output with `get_process_logs`."
    },
    {
      "goal": "see what is shared, or stop sharing",
      "tools": [
        "list_shares",
        "unexpose"
      ],
      "note": "Shares are temporary and never saved to the config file."
    },
    {
      "goal": "troubleshoot a site that does not answer",
      "tools": [
        "get_health_summary",
        "get_runtime_summary",
        "simulate_route"
      ],
      "note": "They report live runtime state, not only config."
    },
    {
      "goal": "write a config change you are unsure about",
      "tools": [
        "get_config_model_reference"
      ],
      "note": "The full reference is large: pass `section` (`backend_kinds`, `middleware_model`, `listener_model` or a type schema name) to read one part."
    },
    {
      "goal": "work with the user's own Cruma (their sites, routes, processes, the desktop app)",
      "tools": [
        "list_agents",
        "use_agent"
      ],
      "note": "`list_agents` shows the agents that run for the user; ask the user before `use_agent` moves this session to one."
    },
    {
      "goal": "show the user their tunnels and settings in the Cruma desktop app",
      "tools": [
        "open_desktop_app"
      ],
      "note": "Only when the user asks to see them; `open_desktop_app` answers unavailable with a reason and an install hint where there is no desktop app or no screen."
    }
  ],
  "usage_guidance": [
    "When planning (a share, several names at once, auth in front of a site, a dev server), choose from the capabilities list first. This agent already serves folders, proxies ports and supervises processes, so never start a separate file or web server, or run `cruma serve` / `cruma proxy`.",
    "Before writing config yourself, call `get_config_model_reference` with a `section` for just the part you need; the whole reference is large.",
    "Use `get_cruma_glossary` before making strong assumptions about Cruma-specific terms.",
    "Use `get_runtime_summary` first when you need a quick live snapshot of tunnel state.",
    "Prefer MCP runtime inspection tools over guessing from config alone when troubleshooting.",
    "An anonymous tunnel is time-limited to 3 hours per agent session; a free sign-in lifts the limit."
  ],
  "documentation_links": [
    {
      "label": "Cruma Website",
      "url": "https://cruma.io"
    },
    {
      "label": "Cruma Docs (Markdown, for agents)",
      "url": "https://cruma.io/llms.txt"
    },
    {
      "label": "Stable Tunnel Agent Release Manifest",
      "url": "https://files.cruma.io/files/tunnel-agent/stable.json"
    },
    {
      "label": "Preview Tunnel Agent Release Manifest",
      "url": "https://files.cruma.io/files/tunnel-agent/preview.json"
    }
  ]
}
