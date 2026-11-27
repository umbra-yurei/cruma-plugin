// The per-run Codex config scripts/codex-eval.mjs adds to a case's own CODEX_HOME. Pure
// functions; scripts/codex-eval.test.mjs covers them.
import { MCP_TOOL_PREFIX } from "./eval-cases.mjs";

const tomlKey = (value) => JSON.stringify(value);

// `codex exec` runs with approval policy `never`, so an MCP call Codex would ask about is refused
// ("MCP tool call requires approval, but approval policy is never"). This approves exactly the
// plugin MCP tools the case's `allowed_tools` declares (`mcp__plugin_<plugin>_<server>__<tool>`),
// the way the Claude arm grants them; every other MCP tool, and the shell, stay as they were.
// Codex reads these tables only from config.toml: a `-c plugins."…".mcp_servers…` override is
// ignored for a plugin's servers (checked against the pinned Codex CLI).
export function mcpApprovalConfig(allowedTools, plugin, pluginId) {
  const prefix = `${MCP_TOOL_PREFIX}plugin_${plugin}_`;
  const tables = [];
  for (const name of allowedTools.filter((tool) => tool.startsWith(MCP_TOOL_PREFIX))) {
    const rest = name.startsWith(prefix) ? name.slice(prefix.length) : "";
    const split = rest.indexOf("__");
    if (split <= 0 || split + 2 >= rest.length) throw new Error(`allowed tool ${name} is not one of the ${plugin} plugin's MCP tools`);
    const [server, tool] = [rest.slice(0, split), rest.slice(split + 2)];
    tables.push(`[plugins.${tomlKey(pluginId)}.mcp_servers.${tomlKey(server)}.tools.${tomlKey(tool)}]\napproval_mode = "approve"\n`);
  }
  return tables.join("\n");
}
