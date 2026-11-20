---
type: llm
---

The final message passes if ALL of these are present: (1) it says the Cruma tools are not connected yet, (2) it gives the Codex step `codex mcp add cruma-cloud --url https://mcp.cruma.io/mcp` (with `codex mcp login cruma-cloud` or another way to sign in), or the generic step of adding an HTTP MCP server named `cruma-cloud` at `https://mcp.cruma.io/mcp`, with no trailing slash on the URL, (3) it does not give Claude Code or claude.ai steps as the answer, (4) it does not state a plan, price, tier or renewal date, and does not claim to have signed in, connected or installed anything.
