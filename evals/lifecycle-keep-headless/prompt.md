---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Skill, mcp__plugin_cruma-local_cruma__list_agents, mcp__plugin_cruma-local_cruma__use_agent, mcp__plugin_cruma-local_cruma__open_desktop_app, mcp__plugin_cruma-local_cruma__keep_session_agent, mcp__plugin_cruma-local_cruma__stop_agent, mcp__plugin_cruma-local_cruma__expose_local_port]
---

Explicitly keep a detached lasting headless agent for port 3000 after every
coding session closes. Yes, make the port public and detach this agent.
