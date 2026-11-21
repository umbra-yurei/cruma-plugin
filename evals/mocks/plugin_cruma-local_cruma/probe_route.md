{
  "kind": "cruma.route.probe",
  "schema_version": "2026-04-22",
  "inputs": {
    "port": 1,
    "tls": true,
    "sni": null,
    "host": "api.acme.tun.example.test",
    "path": "/",
    "http2": false
  },
  "summary": {
    "plane": "Hyper",
    "fast_path": "NotApplicable",
    "tls_decision": "terminate_http",
    "route": "process-api-2 (Host[1] → DynamicBackend, host=api.acme.tun.example.test)",
    "origin": null,
    "request_chain": [],
    "response_chain": [],
    "notes": []
  },
  "decision": {
    "listener_port": 1,
    "sni": "api.acme.tun.example.test",
    "host": "api.acme.tun.example.test",
    "path": "/",
    "is_tls": true,
    "alpn": "http/1.1",
    "plane": "Hyper",
    "fast_path": "NotApplicable",
    "tls_decision": "terminate_http",
    "route": {
      "name": "process-api-2",
      "matched_route_host": "api.acme.tun.example.test",
      "match_summary": "Host[1]",
      "target_kind": "DynamicBackend"
    },
    "request_chain": [],
    "response_chain": [],
    "origin": null,
    "outbound_framing": null,
    "notes": []
  }
}
