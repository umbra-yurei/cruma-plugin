{
  "schema_version": "2026-04-22",
  "kind": "cruma.expose.exposed",
  "public_url": "https://docs.demo1234.tun.example.test",
  "public_hostname": "docs.demo1234.tun.example.test",
  "local_target": "127.0.0.1:3000",
  "name": "docs",
  "frontend_id": "docs",
  "backend_id": "mcp-expose-docs",
  "updated": false,
  "access": {
    "type": "password",
    "username": "cruma",
    "password": "mock-Pw-7Hq2xZ4n"
  },
  "account": {
    "state": "anonymous",
    "sign_up_url": "https://dash.cruma.io/?ref=agent-mcp&client=claude-code"
  },
  "project_file": {
    "status": "not_saved",
    "file": "/workspace/cruma.toml",
    "reason": "literal_secret",
    "message": "kept live and not saved: frontends[0].middlewares[0].users[0].password would be written as a value; use a ${env:NAME}, ${file:PATH} or ${secret:NAME} password reference to have it saved"
  }
}
