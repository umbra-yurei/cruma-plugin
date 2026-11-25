{
  "schema_version": "2026-04-22",
  "kind": "cruma.expose.listed",
  "shares": [
    {
      "kind": "port",
      "name": "app",
      "local_target": "127.0.0.1:3000",
      "public_url": "https://app.demo1234.tun.example.test",
      "frontend_id": "app",
      "access": {
        "type": "sign_in",
        "emails": [],
        "email_domains": [
          "example.com"
        ]
      }
    }
  ],
  "account": {
    "state": "signed_in"
  }
}
