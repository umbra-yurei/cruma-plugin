---
type: regex
target: mock_calls
pattern: '^(?:(?!mcp__plugin_cruma_cruma__use_agent)[\s\S])*mcp__plugin_cruma_cruma__(get_process_logs|probe_route|get_site_summary|get_proxy_routes|get_health_summary|get_runtime_summary|list_recorded_requests)'
match: not_contains
---
