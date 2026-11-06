import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = join(root, "plugins/cruma");
const local = join(root, "plugins/cruma-local");
const cloud = join(root, "plugins/cruma-cloud");
const failures = [];

function json(directory, file) { return JSON.parse(readFileSync(join(directory, file), "utf8")); }
function count(directory) { return readdirSync(directory, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length; }
function validIcon(file) {
  const contents = readFileSync(file);
  if (contents.length < 24 || contents.subarray(1, 4).toString() !== "PNG") return false;
  const width = contents.readUInt32BE(16);
  const height = contents.readUInt32BE(20);
  return width === height && width >= 512 && width <= 2048 && statSync(file).size < 2_000_000;
}

const localClaude = json(local, ".mcp.json");
const localCodex = json(local, "mcp.json").mcpServers;
if (Object.keys(localClaude).join() !== "cruma" || Object.keys(localCodex).join() !== "cruma") failures.push("cruma-local manifests must declare only `cruma`");
if (localClaude.cruma?.args?.length !== 1 || localCodex.cruma?.args?.length !== 1) failures.push("cruma-local manifests must pass only the launcher file; the launcher owns origin arguments");
const claudeLauncher = localClaude.cruma?.args?.[0]?.replace("${CLAUDE_PLUGIN_ROOT}/", "");
const codexLauncher = localCodex.cruma?.args?.[0]?.replace("${PLUGIN_ROOT}/", "");
if (localClaude.cruma?.command !== "node" || claudeLauncher !== codexLauncher || !existsSync(join(local, claudeLauncher ?? ""))) failures.push("cruma-local manifests must run the same in-plugin Node launcher");

const agent = readFileSync(join(local, "skills/agent/SKILL.md"), "utf8");
if (!/^name: agent$/m.test(agent) || /^disable-model-invocation:/m.test(agent)) failures.push("cruma-local agent skill must be model-invocable and named agent");
if (/session_context|\/cruma:(board|memory)|skills\/(board|memory)/.test(agent)) failures.push("cruma-local agent skill must not contain cloud session, board, or memory instructions");

// The directory-bound plugin is a skill and nothing else: no MCP server, hook, launcher or script.
for (const entry of readdirSync(directory, { recursive: true })) {
  if (/(^|[/\\])(\.?mcp\.json|mcp|hooks|scripts|bin)([/\\]|$)/.test(entry) || entry.endsWith(".mjs") || entry.endsWith(".sh")) failures.push(`cruma ships only a skill; remove ${entry}`);
}
const directorySkill = readFileSync(join(directory, "skills/agent/SKILL.md"), "utf8");
if (!/^name: agent$/m.test(directorySkill) || /^disable-model-invocation:/m.test(directorySkill)) failures.push("cruma agent skill must be model-invocable and named agent");
if (readdirSync(join(directory, "skills")).join() !== "agent") failures.push("cruma must ship only the agent skill");
if (!directorySkill.includes("claude mcp add --scope user cruma -- cruma mcp")) failures.push("cruma agent skill must give the consent-gated `claude mcp add --scope user cruma -- cruma mcp` step");
if (/session_context|\/cruma:(board|memory)|skills\/(board|memory)/.test(directorySkill)) failures.push("cruma agent skill must not contain cloud session, board, or memory instructions");

for (const name of ["board", "memory"]) {
  const file = join(cloud, `skills/${name}/SKILL.md`);
  const text = readFileSync(file, "utf8");
  if (!new RegExp(`^name: ${name}$`, "m").test(text) || !/^disable-model-invocation: true$/m.test(text)) failures.push(`cruma-cloud ${name} skill must be user-invoked only`);
  if (!text.includes(`/cruma-cloud:${name}`)) failures.push(`cruma-cloud ${name} skill must name its cloud command`);
}
const cloudSkill = readFileSync(join(cloud, "skills/cloud/SKILL.md"), "utf8");
if (!/^name: cloud$/m.test(cloudSkill) || /^disable-model-invocation:/m.test(cloudSkill)) failures.push("cruma-cloud cloud skill must be model-invocable");
for (const [plugin, name] of [[directory, "agent"], [local, "agent"], [cloud, "cloud"], [cloud, "board"], [cloud, "memory"]]) {
  if (/\|\s*(ba)?sh\b/.test(readFileSync(join(plugin, `skills/${name}/SKILL.md`), "utf8"))) failures.push(`${plugin.slice(root.length + 1)} ${name} skill pipes into a shell`);
}
if (existsSync(join(local, "skills/agent/scripts"))) failures.push("cruma-local agent skill must not ship installer scripts");

const hooks = json(cloud, "hooks/hooks.json").hooks;
if (Object.keys(hooks).join() !== "SessionStart") failures.push("cruma-cloud hooks must declare only SessionStart");
const hookCommands = (hooks.SessionStart ?? []).flatMap((entry) => entry.hooks);
const hook = hookCommands.length === 1 ? hookCommands[0] : undefined;
const hookFile = /^\$\{CLAUDE_PLUGIN_ROOT\}\/([^"']+)$/.exec(hook?.args?.length === 1 ? hook.args[0] : "")?.[1];
if (hook?.command !== "node") failures.push("cruma-cloud hook command must be the Node interpreter");
if (!hookFile || !existsSync(join(cloud, hookFile))) failures.push("cruma-cloud must run one in-plugin SessionStart hook");
else if (!readFileSync(join(cloud, hookFile), "utf8").includes('from "../mcp/launcher.mjs"')) failures.push("cruma-cloud hook must use its own launcher");

for (const [plugin, name] of [[local, "cruma-local"], [cloud, "cruma-cloud"]]) {
  for (const entry of readdirSync(plugin, { recursive: true })) {
    if (!entry.endsWith(".mjs")) continue;
    const file = join(plugin, entry);
    const source = readFileSync(file, "utf8");
    if (/process\.env\b(?!\[name\])/g.test(source)) failures.push(`${name} ${file.slice(plugin.length + 1)} reads the whole process environment`);
  }
}

for (const [plugin, name] of [[directory, "cruma"], [local, "cruma-local"], [cloud, "cruma-cloud"]]) {
  const versions = [".claude-plugin/plugin.json", "plugin.json"].map((file) => json(plugin, file).version);
  if (new Set(versions).size !== 1 || !versions[0]) failures.push(`${name} manifest versions differ or are missing`);
  const icon = join(plugin, ".claude-plugin/icon.png");
  if (!existsSync(icon) || !validIcon(icon)) failures.push(`${name} Claude plugin icon must be a square 512–2048 px PNG under 2 MB`);
  if (!existsSync(join(plugin, "LICENSE"))) failures.push(`${name} must include LICENSE`);
  if (count(plugin) >= 512) failures.push(`${name} has ${count(plugin)} files; must stay below 512`);
}

const cloudClaude = Object.keys(json(cloud, ".mcp.json"));
const cloudCodex = Object.keys(json(cloud, "mcp.json").mcpServers);
if (cloudClaude.join() !== "cruma-cloud" || cloudCodex.join() !== "cruma-cloud") failures.push("cruma-cloud manifests must declare only `cruma-cloud`");
const marketplace = json(root, ".claude-plugin/marketplace.json");
for (const name of ["cruma", "cruma-local", "cruma-cloud"]) {
  if (marketplace.plugins.find((plugin) => plugin.name === name)?.source !== `./plugins/${name}`) failures.push(`marketplace ${name} source must be ./plugins/${name}`);
}
if (!marketplace.plugins.find((plugin) => plugin.name === "cruma")?.relevance) failures.push("marketplace cruma entry must keep its relevance block");
if (marketplace.plugins.find((plugin) => plugin.name === "cruma-local")?.relevance) failures.push("marketplace cruma-local entry must not carry relevance; only cruma is suggested");
for (const plugin of marketplace.plugins) if ("version" in plugin) failures.push(`marketplace entry ${plugin.name} must not set version`);

if (failures.length) { console.error(failures.map((failure) => `check-plugin: ${failure}`).join("\n")); process.exit(1); }
console.log(`check-plugin: ok (cruma ${count(directory)} files; cruma-local ${count(local)} files; cruma-cloud ${count(cloud)} files)`);
