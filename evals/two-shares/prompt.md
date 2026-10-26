---
max_turns: 20
timeout_seconds: 300
allowed_tools: [Skill, mcp__plugin_cruma_cruma__describe_cruma, mcp__plugin_cruma_cruma__get_runtime_summary, mcp__plugin_cruma_cruma__expose_local_directory, mcp__plugin_cruma_cruma__expose_local_port, mcp__plugin_cruma_cruma__list_shares, mcp__plugin_cruma_cruma__upsert_backend, mcp__plugin_cruma_cruma__upsert_frontend, mcp__plugin_cruma_cruma__upsert_process, mcp__plugin_cruma_cruma__get_health_summary]
---

Serve the docs folder /tmp/docs and my app, which already runs on port 3000, so
both are publicly reachable at the same time. Yes, I confirm that this folder
and port 3000 may be made publicly reachable.
