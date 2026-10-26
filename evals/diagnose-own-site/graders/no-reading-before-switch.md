---
type: llm
focus: mock_calls
---

The tool calls happen in this order: `list_agents`, then `use_agent`, and only afterwards any reading tool (`get_process_logs`, `probe_route`, `get_site_summary`, `get_proxy_routes`, `get_health_summary`, `get_runtime_summary`). It passes if no reading tool call appears before the `use_agent` call.
