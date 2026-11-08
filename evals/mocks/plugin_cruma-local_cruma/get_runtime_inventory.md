{
  "schema_version": "2026-04-22",
  "kind": "cruma.runtime.inventory",
  "full": false,
  "sections_requested": [],
  "assigned_domain": "demo1234.tun.example.test",
  "tunnel_plan": "anonymous",
  "counts": {
    "frontends": 0,
    "backends": 0,
    "oauth2_providers": 1,
    "processes": 0,
    "listeners": 0,
    "transports": 2,
    "kubernetes_targets": 0,
    "tcp_ports": 0
  },
  "inventory": {
    "frontends": [],
    "backends": [],
    "oauth2_providers": [
      {
        "id": "cruma",
        "label": "Sign in with Cruma",
        "built_in": true
      }
    ],
    "processes": [],
    "listeners": [],
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
