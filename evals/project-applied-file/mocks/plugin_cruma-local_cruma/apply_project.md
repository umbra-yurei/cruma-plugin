{
  "schema_version": "2026-04-22",
  "kind": "cruma.project.summary",
  "file": "/workspace/cruma.toml",
  "state": "applied",
  "connections": 1,
  "frontends": [
    {
      "hostname": "app",
      "target": "web"
    }
  ],
  "backends": [
    {
      "id": "web",
      "kind": "http",
      "destination": "127.0.0.1:8080"
    }
  ],
  "processes": [
    {
      "id": "worker",
      "command": "cargo run --bin worker",
      "starts_on_apply": false
    }
  ],
  "ignored_sections": []
}
