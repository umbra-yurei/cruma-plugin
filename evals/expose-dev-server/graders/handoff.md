---
type: llm
---

The final message, which hands the exposed server to the user, passes only if
ALL of these hold:

1. It gives the public HTTPS URL on the host `demo1234.tun.example.test`, either
   as is or with a `port-3000.` label in front (`https://demo1234.tun.example.test`
   or `https://port-3000.demo1234.tun.example.test`). A trailing slash is fine.
2. It says the URL forwards to local port 3000.
3. It says the health check (`get_health_summary`) reported ok / healthy.
4. It names the path used: `expose_local_port`, or `upsert_backend` and
   `upsert_frontend`.
5. It gives no other URL on any other host, and does not tell the user to edit a
   file. Saying that nothing was written to disk is fine.
