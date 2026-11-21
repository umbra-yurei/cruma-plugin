{
  "kind": "cruma.proxy.routes",
  "schema_version": "2026-04-27",
  "field_definitions": {
    "listeners": "Live generated proxy listeners with sanitized HTTP route summaries, including injected routes such as cruma-local-mcp.",
    "routes": "Per-listener HTTP routes after config mutators have run. Includes route names, priorities, match filters, targets, and sanitized middleware summaries.",
    "middlewares": "Middleware summaries for this route. The middleware type (e.g. form_auth, basic_auth, oauth2), usernames, login/logout paths, and other non-sensitive settings are included. Only credential values (passwords, session secrets, API keys, JWT secrets) are replaced with \"<redacted>\".",
    "filter": "Optional case-insensitive substring applied only to compact route metadata such as listener kind/port, route names, host patterns, path prefixes, target ids, and middleware types."
  },
  "filter": null,
  "listener_count": 1,
  "listeners": [
    {
      "index": 0,
      "kind": "tls",
      "port": 1,
      "advertise_h3": true,
      "routes": [
        {
          "index": 0,
          "name": "process-api-1",
          "sni": "api.acme.tun.example.test",
          "alpn": null,
          "action": "terminate_for_http",
          "http_routes": [
            {
              "index": 0,
              "name": "process-api-1",
              "priority": 2,
              "filter": {
                "type": "host",
                "hosts": [
                  "api.acme.tun.example.test"
                ]
              },
              "middleware_count": 0,
              "middlewares": [],
              "forwarded_headers_mode": "Preserve",
              "target": {
                "type": "dynamic_backend",
                "resolver": "process-orchestrator"
              }
            }
          ]
        }
      ]
    }
  ]
}
