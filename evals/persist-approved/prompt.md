---
max_turns: 10
timeout_seconds: 240
allowed_tools: [Skill, mcp__plugin_cruma_cruma__describe_cruma, mcp__plugin_cruma_cruma__list_agents, mcp__plugin_cruma_cruma__use_agent, mcp__plugin_cruma_cruma__get_runtime_summary, mcp__plugin_cruma_cruma__get_health_summary, mcp__plugin_cruma_cruma__get_site_summary, mcp__plugin_cruma_cruma__get_proxy_routes, mcp__plugin_cruma_cruma__probe_route, mcp__plugin_cruma_cruma__get_process_logs, mcp__plugin_cruma_cruma__list_recorded_requests, mcp__plugin_cruma_cruma__expose_local_port, mcp__plugin_cruma_cruma__expose_local_directory, mcp__plugin_cruma_cruma__list_shares, mcp__plugin_cruma_cruma__unexpose, mcp__plugin_cruma_cruma__upsert_backend, mcp__plugin_cruma_cruma__upsert_frontend, mcp__plugin_cruma_cruma__upsert_process]
---

Set up a permanent site `docs` for /home/dev/docs on my desktop Cruma (profile work). Yes, you may switch to that agent. I approve exactly this saved change: a local-directory backend `docs` for /home/dev/docs and a frontend `docs.acme.tun.example.test` pointing at it, saved with persist true.
