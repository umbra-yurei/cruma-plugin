// Structural checks the plugin validator does not make: the MCP server runs a file inside
// the plugin, the skill directory matches its name, and the skill pipes nothing into a shell.
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

const server = JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8")).cruma;
const [launcher, ...extra] = server.args;
if (server.command !== "node" || extra.length > 0 || !launcher.startsWith("${CLAUDE_PLUGIN_ROOT}/")) {
  failures.push('.mcp.json must run `node ${CLAUDE_PLUGIN_ROOT}/<file>` with no other arguments');
} else if (!existsSync(join(root, launcher.replace("${CLAUDE_PLUGIN_ROOT}/", "")))) {
  failures.push(`.mcp.json runs ${launcher}, which is not in the plugin`);
}

const skill = readFileSync(join(root, "skills/agent/SKILL.md"), "utf8");
if (!/^name: agent$/m.test(skill)) failures.push("skills/agent/SKILL.md must have `name: agent`");
if (/\|\s*(ba)?sh\b/.test(skill)) failures.push("skills/agent/SKILL.md pipes into a shell");
if (!existsSync(join(root, "skills/agent/scripts/linux-install.sh"))) failures.push("bundled Linux installer is missing");

// Claude Code's manifest `version` overrides the marketplace entry's, so the entry must not carry one;
// the Codex manifest at the repository root must match the Claude one.
const versions = [".claude-plugin/plugin.json", "plugin.json"].map((file) => JSON.parse(readFileSync(join(root, file), "utf8")).version);
if (new Set(versions).size !== 1 || !versions[0]) failures.push(`plugin.json versions differ or are missing: ${versions.join(", ")}`);
const marketplace = JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8"));
for (const plugin of marketplace.plugins) {
  if ("version" in plugin) failures.push(`.claude-plugin/marketplace.json entry ${plugin.name} must not set \`version\`; .claude-plugin/plugin.json is the single source`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `check-plugin: ${failure}`).join("\n"));
  process.exit(1);
}
console.log("check-plugin: ok");
