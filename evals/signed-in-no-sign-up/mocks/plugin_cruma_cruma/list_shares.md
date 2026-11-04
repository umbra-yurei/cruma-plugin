{
  "schema_version": "2026-04-22",
  "kind": "cruma.expose.listed",
  "shares": [
    {
      "kind": "port",
      "name": "app",
      "local_target": "127.0.0.1:3000",
      "public_url": "https://app.demo1234.tun.example.test",
      "frontend_id": "app"
    },
    {
      "kind": "directory",
      "name": "docs",
      "local_target": "/tmp/docs",
      "public_url": "https://docs.demo1234.tun.example.test",
      "frontend_id": "docs"
    }
  ],
  "account": {
    "state": "signed_in"
  }
}
