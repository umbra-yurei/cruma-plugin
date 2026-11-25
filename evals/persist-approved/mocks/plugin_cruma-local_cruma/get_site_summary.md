{
  "schema_version": "2026-04-22",
  "kind": "cruma.runtime.site_summary",
  "results": {
    "api.acme.tun.example.test": {
      "found": true,
      "match_type": "frontend",
      "hostname": "api.acme.tun.example.test",
      "target_mode": "process",
      "listener_kinds": null,
      "listeners": [
        {
          "kind": "CRUMA",
          "port": 1,
          "addr": "localhost",
          "cert_mode": "Self-Signed",
          "bound": true,
          "last_error": null
        }
      ],
      "backend": null,
      "process": {
        "id": "api",
        "command": "node server.js",
        "args": [],
        "working_directory": null,
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
        "last_error": "node: command not found",
        "binary_warning": null
      },
      "path_routes": [],
      "middlewares": [],
      "forward_host_header": false,
      "cert_mode_override": null
    }
  }
}
