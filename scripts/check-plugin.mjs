import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const local = join(root, "plugins/cruma");
const cloud = join(root, "plugins/cruma-cloud");
const failures = [];

function json(directory, file) { return JSON.parse(readFileSync(join(directory, file), "utf8")); }
function count(directory) { return readdirSync(directory, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length; }

const localClaude = json(local, ".mcp.json");
const localCodex = json(local, "mcp.json").mcpServers;
if (Object.keys(localClaude).join() !== "cruma" || Object.keys(localCodex).join() !== "cruma") failures.push("cruma manifests must declare only `cruma`");
const claudeLauncher = localClaude.cruma?.args?.[0]?.replace("${CLAUDE_PLUGIN_ROOT}/", "");
const codexLauncher = localCodex.cruma?.args?.[0]?.replace("${PLUGIN_ROOT}/", "");
if (localClaude.cruma?.command !== "node" || claudeLauncher !== codexLauncher || !existsSync(join(local, claudeLauncher ?? ""))) failures.push("cruma manifests must run the same in-plugin Node launcher");

const agent = readFileSync(join(local, "skills/agent/SKILL.md"), "utf8");
if (!/^name: agent$/m.test(agent) || /^disable-model-invocation:/m.test(agent)) failures.push("cruma agent skill must be model-invocable and named agent");
if (/session_context|\/cruma:(board|memory)|skills\/(board|memory)/.test(agent)) failures.push("cruma agent skill must not contain cloud session, board, or memory instructions");

for (const name of ["board", "memory"]) {
  const file = join(cloud, `skills/${name}/SKILL.md`);
  const text = readFileSync(file, "utf8");
  if (!new RegExp(`^name: ${name}$`, "m").test(text) || !/^disable-model-invocation: true$/m.test(text)) failures.push(`cruma-cloud ${name} skill must be user-invoked only`);
  if (!text.includes(`/cruma-cloud:${name}`)) failures.push(`cruma-cloud ${name} skill must name its cloud command`);
}
const cloudSkill = readFileSync(join(cloud, "skills/cloud/SKILL.md"), "utf8");
if (!/^name: cloud$/m.test(cloudSkill) || /^disable-model-invocation:/m.test(cloudSkill)) failures.push("cruma-cloud cloud skill must be model-invocable");
for (const [directory, name] of [[local, "agent"], [cloud, "cloud"], [cloud, "board"], [cloud, "memory"]]) {
  if (/\|\s*(ba)?sh\b/.test(readFileSync(join(directory, `skills/${name}/SKILL.md`), "utf8"))) failures.push(`${name} skill pipes into a shell`);
}
if (existsSync(join(local, "skills/agent/scripts"))) failures.push("cruma agent skill must not ship installer scripts");

const hooks = json(cloud, "hooks/hooks.json").hooks;
if (Object.keys(hooks).join() !== "SessionStart") failures.push("cruma-cloud hooks must declare only SessionStart");
const commands = (hooks.SessionStart ?? []).flatMap((entry) => entry.hooks.map((hook) => hook.command));
const hookFile = /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)"$/.exec(commands.length === 1 ? commands[0] : "")?.[1];
if (!hookFile || !existsSync(join(cloud, hookFile))) failures.push("cruma-cloud must run one in-plugin SessionStart hook");
else if (!readFileSync(join(cloud, hookFile), "utf8").includes('from "../mcp/launcher.mjs"')) failures.push("cruma-cloud hook must use its own launcher");

for (const [directory, name] of [[local, "cruma"], [cloud, "cruma-cloud"]]) {
  const versions = [".claude-plugin/plugin.json", "plugin.json"].map((file) => json(directory, file).version);
  if (new Set(versions).size !== 1 || !versions[0]) failures.push(`${name} manifest versions differ or are missing`);
  if (!existsSync(join(directory, "LICENSE"))) failures.push(`${name} must include LICENSE`);
  if (count(directory) >= 512) failures.push(`${name} has ${count(directory)} files; must stay below 512`);
}

const cloudClaude = Object.keys(json(cloud, ".mcp.json"));
const cloudCodex = Object.keys(json(cloud, "mcp.json").mcpServers);
if (cloudClaude.join() !== "cruma-cloud" || cloudCodex.join() !== "cruma-cloud") failures.push("cruma-cloud manifests must declare only `cruma-cloud`");
const marketplace = json(root, ".claude-plugin/marketplace.json");
if (marketplace.plugins.find((plugin) => plugin.name === "cruma")?.source !== "./plugins/cruma") failures.push("marketplace cruma source must be ./plugins/cruma");
for (const plugin of marketplace.plugins) if ("version" in plugin) failures.push(`marketplace entry ${plugin.name} must not set version`);

if (failures.length) { console.error(failures.map((failure) => `check-plugin: ${failure}`).join("\n")); process.exit(1); }
console.log(`check-plugin: ok (cruma ${count(local)} files; cruma-cloud ${count(cloud)} files)`);
