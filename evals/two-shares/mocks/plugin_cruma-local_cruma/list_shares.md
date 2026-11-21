{
  "schema_version": "2026-04-22",
  "kind": "cruma.expose.listed",
  "shares": [
    {
      "kind": "directory",
      "name": "docs",
      "local_target": "/tmp/docs",
      "public_url": "https://docs.demo1234.tun.example.test",
      "frontend_id": "docs"
    },
    {
      "kind": "port",
      "name": "port-3000",
      "local_target": "127.0.0.1:3000",
      "public_url": "https://port-3000.demo1234.tun.example.test",
      "frontend_id": "port-3000"
    }
  ],
  "account": {
    "state": "anonymous",
    "sign_up_url": "https://dash.cruma.io/?ref=agent-mcp&client=claude-code"
  }
}
