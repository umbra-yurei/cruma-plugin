// Structural checks the plugin validator does not make: the MCP server runs a file inside
// the plugin, the skill directory matches its name, the skill pipes nothing into a shell, and only the
// opt-in cruma-cloud plugin declares the cloud server.
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

const servers = JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"));
// The cloud server asks to sign in, so it lives only in the opt-in cruma-cloud plugin.
if (Object.keys(servers).join() !== "cruma") failures.push(".mcp.json must declare only the local `cruma` server");
if (existsSync(join(root, "mcp.json"))) failures.push("mcp.json must not exist: Codex reads it, and the cruma plugin adds no server beyond .mcp.json's");
const server = servers.cruma;
const [launcher, ...extra] = server.args;
// The one flag the launcher hands `cruma mcp`, so what a coding agent shares is attributed to the plugin.
if (server.command !== "node" || extra.join(" ") !== "--origin plugin" || !launcher.startsWith("${CLAUDE_PLUGIN_ROOT}/")) {
  failures.push('.mcp.json must run `node ${CLAUDE_PLUGIN_ROOT}/<file> --origin plugin` with no other arguments');
} else if (!existsSync(join(root, launcher.replace("${CLAUDE_PLUGIN_ROOT}/", "")))) {
  failures.push(`.mcp.json runs ${launcher}, which is not in the plugin`);
}

const skill = readFileSync(join(root, "skills/agent/SKILL.md"), "utf8");
if (!/^name: agent$/m.test(skill)) failures.push("skills/agent/SKILL.md must have `name: agent`");
if (/\|\s*(ba)?sh\b/.test(skill)) failures.push("skills/agent/SKILL.md pipes into a shell");
if (existsSync(join(root, "skills/agent/scripts"))) failures.push("skills/agent/scripts must not exist: the plugin ships no download-and-run installer");

// Claude Code's manifest `version` overrides the marketplace entry's, so the entry must not carry one;
// the Codex manifest at the repository root must match the Claude one.
const versions = [".claude-plugin/plugin.json", "plugin.json"].map((file) => JSON.parse(readFileSync(join(root, file), "utf8")).version);
if (new Set(versions).size !== 1 || !versions[0]) failures.push(`plugin.json versions differ or are missing: ${versions.join(", ")}`);
const cloud = join(root, "plugins/cruma-cloud");
const cloudVersions = [".claude-plugin/plugin.json", "plugin.json"].map((file) => JSON.parse(readFileSync(join(cloud, file), "utf8")).version);
if (new Set(cloudVersions).size !== 1 || !cloudVersions[0]) failures.push(`plugins/cruma-cloud plugin.json versions differ or are missing: ${cloudVersions.join(", ")}`);
const cloudClaude = Object.keys(JSON.parse(readFileSync(join(cloud, ".mcp.json"), "utf8")));
const cloudCodex = Object.keys(JSON.parse(readFileSync(join(cloud, "mcp.json"), "utf8")).mcpServers);
if (cloudClaude.join() !== "cruma-cloud" || cloudCodex.join() !== "cruma-cloud") failures.push("plugins/cruma-cloud .mcp.json and mcp.json must each declare only `cruma-cloud`");
const marketplace = JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8"));
for (const plugin of marketplace.plugins) {
  if ("version" in plugin) failures.push(`.claude-plugin/marketplace.json entry ${plugin.name} must not set \`version\`; .claude-plugin/plugin.json is the single source`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `check-plugin: ${failure}`).join("\n"));
  process.exit(1);
}
console.log("check-plugin: ok");
