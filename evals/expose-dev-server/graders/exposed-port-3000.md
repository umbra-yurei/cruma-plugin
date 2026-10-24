---
type: regex
target: mock_calls
---
expose_local_port[\s\S]{0,200}?"port"\s*:\s*"?3000\b|^(?=[\s\S]*upsert_backend[\s\S]{0,300}?127\.0\.0\.1:3000)(?=[\s\S]*upsert_frontend[\s\S]{0,300}?demo1234\.tun\.example\.test)
