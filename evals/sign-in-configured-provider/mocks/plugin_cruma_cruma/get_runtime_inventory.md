{
  "schema_version": "2026-04-22",
  "kind": "cruma.runtime.inventory",
  "full": true,
  "sections_requested": [],
  "assigned_domain": "acme.tun.example.test",
  "tunnel_plan": "free",
  "counts": {
    "frontends": 1,
    "backends": 0,
    "oauth2_providers": 2,
    "processes": 1,
    "listeners": 1,
    "transports": 2,
    "kubernetes_targets": 0,
    "tcp_ports": 0
  },
  "inventory": {
    "frontends": [
      {
        "hostname": "admin.acme.tun.example.test",
        "target_mode": "process",
        "backend_id": null,
        "kubernetes_target_id": null,
        "path_routes": [],
        "process_id": "api",
        "listener_kinds": [
          "cruma"
        ],
        "middleware_count": 1,
        "middlewares": [
          {
            "index": 0,
            "type": "oauth2",
            "implemented": true,
            "logout_path": "/oauth2/logout",
            "cookie_name": "cruma_session",
            "cookie_secure": true,
            "cookie_same_site": "Lax",
            "session_ttl_secs": 86400,
            "provider_ids": [
              "google"
            ],
            "has_builtin_auth": false,
            "callback_path": "/oauth2/callback",
            "has_bearer_validator": false,
            "session_secret": "<redacted>"
          }
        ],
        "alpn": null,
        "forward_host_header": true,
        "cert_mode_override": null,
        "cert_mode_overrides": null
      }
    ],
    "backends": [],
    "oauth2_providers": [
      {
        "id": "cruma",
        "label": "Sign in with Cruma",
        "built_in": true
      },
      {
        "id": "google",
        "label": "Google",
        "built_in": false
      }
    ],
    "processes": [
      {
        "id": "api",
        "command": "node",
        "args": [
          "server.js"
        ],
        "working_directory": "/home/dev/api",
        "auto_start": true,
        "start_on_request": false,
        "restart_policy": "OnFailure",
        "upstream_protocol": "H1",
        "upstream_tls": false,
        "idle_timeout_seconds": null,
        "backend_timeout_seconds": null,
        "env": {},
        "registered_in_runtime": true,
        "desired_state": "Running",
        "phase": "Failed",
        "pid": null,
        "running": false,
        "allocated_port": null,
        "enabled": true,
        "resolved_bin": null,
        "resolved_dir": null,
        "last_error": "process exited with status 1",
        "binary_warning": null
      }
    ],
    "listeners": [
      {
        "kind": "HTTPS",
        "port": 8443,
        "addr": "127.0.0.1",
        "uses_local_socket": false,
        "cert_mode": "Self-Signed",
        "bound": true,
        "last_error": null
      }
    ],
    "transports": [
      {
        "key": "0-Quic",
        "instance_idx": 0,
        "protocol": "Quic",
        "addr": "203.0.113.10:443",
        "status": "Connected",
        "sessions": 1,
        "last_error": null
      },
      {
        "key": "1-Http2",
        "instance_idx": 1,
        "protocol": "Http2",
        "addr": "203.0.113.10:443",
        "status": "Connected",
        "sessions": 1,
        "last_error": null
      }
    ],
    "kubernetes_targets": [],
    "tcp_ports": {
      "assigned_dns_name": null,
      "ports": []
    }
  },
  "field_definitions": {
    "full": "When false (default) each section contains only names/IDs. Pass true for complete field detail. For a targeted per-site view use get_site_summary instead.",
    "frontends": "Incoming hostname/listener/path routing rules that point to a backend or hosted process.",
    "backends": "Reusable upstream destination definitions referenced by frontends.",
    "kubernetes_targets": "Kubernetes service targets that frontends can route to via dynamic backend resolution.",
    "middlewares": "Middleware summaries per frontend/backend. The middleware type (e.g. form_auth, basic_auth, oauth2, authentication, ip_filter), usernames, login/logout paths, and other non-sensitive settings are included. Only credential values (passwords, session secrets, API keys, JWT secrets) are replaced with \"<redacted>\".",
    "processes": "Hosted process runtime statuses managed by Cruma's process supervisor.",
    "listeners": "Configured local listener definitions enriched with current bind status.",
    "transports": "Live tunnel transport entries from the agent runtime snapshot. Only included in full mode.",
    "tcp_ports": "User-facing view of IPv6 TCP port forwards. Each entry maps a configured port number to its local backend destination and the remote access address (<tcp_dns_name>:<port>). The assigned_dns_name field is the top-level DNS name for all TCP ports on this agent."
  }
}
