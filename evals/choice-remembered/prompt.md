---
max_turns: 16
timeout_seconds: 300
allowed_tools: [Skill, mcp__plugin_cruma_cruma__describe_cruma, mcp__plugin_cruma_cruma__list_agents, mcp__plugin_cruma_cruma__use_agent, mcp__plugin_cruma_cruma__get_runtime_summary, mcp__plugin_cruma_cruma__get_health_summary, mcp__plugin_cruma_cruma__expose_local_port, mcp__plugin_cruma_cruma__expose_local_directory, mcp__plugin_cruma_cruma__list_shares, mcp__plugin_cruma_cruma__unexpose, mcp__plugin_cruma_cruma__upsert_backend, mcp__plugin_cruma_cruma__upsert_frontend]
---

Serve my docs folder /home/dev/docs as `docs` and my app, which already runs on
port 3000, as `app`. Yes, I confirm that this folder and port 3000 may be made
publicly reachable. If you ask whether to use my running Cruma or a temporary
anonymous tunnel: use my running Cruma (the desktop agent, profile work), for
both.
