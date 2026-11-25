// Checks the Codex-format manifests the way Codex reads them. The pinned Codex CLI has no
// `plugin validate`, so this installs the marketplace and every plugin into a throwaway
// CODEX_HOME and asserts what Codex resolved: each plugin's version, its skills, and the
// `mcp.json` servers. It also validates every plugins/*/plugin.json and mcp.json against the
// agent-plugins.org schema named in its `$schema`. No credentials are used.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { CODEX_VERSION, ensureTools, runCodex } from "./codex-tools.mjs";
import { EVAL_WORK, MARKETPLACE_FILE, root } from "./eval-cases.mjs";

const failures = [];
const { codex, requireTool } = ensureTools();
const json = (file) => JSON.parse(readFileSync(file, "utf8"));

// 1. Every Agent Plugins manifest against the schema it declares.
const Ajv2020 = requireTool("ajv/dist/2020").default;
const ajv = new Ajv2020({ allErrors: true, strict: true });
const schemas = new Map();
const marketplace = json(MARKETPLACE_FILE);
for (const { name } of marketplace.plugins) {
  for (const file of ["plugin.json", "mcp.json"]) {
    const path = join(root, "plugins", name, file);
    if (!existsSync(path)) continue;
    const manifest = json(path);
    const declared = manifest.$schema;
    if (typeof declared !== "string" || !declared.startsWith("https://agent-plugins.org/schemas/")) {
      failures.push(`plugins/${name}/${file} must declare an agent-plugins.org $schema`);
      continue;
    }
    if (!schemas.has(declared)) {
      const response = await fetch(declared);
      if (!response.ok) throw new Error(`fetching ${declared}: HTTP ${response.status}`);
      schemas.set(declared, ajv.compile(await response.json()));
    }
    const validate = schemas.get(declared);
    if (!validate(manifest)) {
      for (const error of validate.errors) failures.push(`plugins/${name}/${file} ${error.instancePath || "/"} ${error.message}${error.params?.additionalProperty ? ` (${error.params.additionalProperty})` : ""} [${declared}]`);
    }
  }
}

// 2. What the pinned Codex resolves from a local install of the marketplace.
const work = join(EVAL_WORK, "codex-check");
rmSync(work, { recursive: true, force: true });
const codexHome = join(work, "codex-home");
const home = join(work, "home");
mkdirSync(codexHome, { recursive: true });
mkdirSync(home, { recursive: true });
function codexJson(args) {
  const result = runCodex(codex, args, { codexHome, home, cwd: home });
  if (result.status !== 0) throw new Error(`codex ${args.join(" ")} exited ${result.status}:\n${result.stderr}`);
  return args.includes("--json") ? JSON.parse(result.stdout) : result.stdout;
}

const version = runCodex(codex, ["--version"], { codexHome, home }).stdout.trim();
if (version !== `codex-cli ${CODEX_VERSION}`) failures.push(`expected codex-cli ${CODEX_VERSION}, ran ${version}`);

const added = codexJson(["plugin", "marketplace", "add", root, "--json"]);
if (added.marketplaceName !== marketplace.name) failures.push(`Codex named the marketplace ${added.marketplaceName}, not ${marketplace.name}`);

const installedPaths = new Map();
for (const { name } of marketplace.plugins) {
  const result = codexJson(["plugin", "add", `${name}@${marketplace.name}`, "--json"]);
  const expected = json(join(root, "plugins", name, "plugin.json")).version;
  if (result.version !== expected) failures.push(`Codex installed ${name} ${result.version}, plugin.json says ${expected}`);
  installedPaths.set(name, result.installedPath);
}
const listed = codexJson(["plugin", "list", "--json"]).installed;
for (const { name } of marketplace.plugins) {
  const entry = listed.find((plugin) => plugin.name === name && plugin.marketplaceName === marketplace.name);
  if (!entry?.installed || !entry.enabled) failures.push(`Codex does not list ${name} as installed and enabled`);
}

// Skills: the model-visible skill list Codex renders at session start, one `- <plugin>:<skill>: …` line each.
const promptInput = codexJson(["debug", "prompt-input", "hi"]);
const skillText = JSON.parse(promptInput)
  .flatMap((item) => item.content ?? [])
  .map((content) => content.text ?? "")
  .find((text) => text.startsWith("<skills_instructions>")) ?? "";
const pluginNames = new Set(marketplace.plugins.map((plugin) => plugin.name));
const resolvedSkills = [...skillText.matchAll(/^- ([a-z0-9.-]+):([a-z0-9.-]+): /gm)]
  .filter(([, plugin]) => pluginNames.has(plugin))
  .map(([, plugin, skill]) => `${plugin}:${skill}`)
  .sort();
const expectedSkills = marketplace.plugins
  .flatMap(({ name }) => readdirSync(join(root, "plugins", name, "skills")).map((skill) => `${name}:${skill}`))
  .sort();
if (resolvedSkills.join() !== expectedSkills.join()) failures.push(`Codex resolved skills [${resolvedSkills.join(", ")}], expected [${expectedSkills.join(", ")}]`);

// MCP servers: exactly the plugins' mcp.json servers, with ${PLUGIN_ROOT} expanded to the install.
const servers = new Map(codexJson(["mcp", "list", "--json"]).map((server) => [server.name, server]));
const expectedServers = [];
for (const { name } of marketplace.plugins) {
  const file = join(root, "plugins", name, "mcp.json");
  if (!existsSync(file)) continue;
  const installed = installedPaths.get(name);
  for (const [server, declared] of Object.entries(json(file).mcpServers)) {
    expectedServers.push(server);
    const transport = servers.get(server)?.transport;
    if (!servers.get(server)?.enabled) failures.push(`Codex did not enable ${name}'s MCP server ${server}`);
    else if (declared.type === "stdio") {
      const args = (declared.args ?? []).map((arg) => arg.replaceAll("${PLUGIN_ROOT}", installed));
      if (transport.type !== "stdio" || transport.command !== declared.command || JSON.stringify(transport.args) !== JSON.stringify(args)) {
        failures.push(`Codex resolved ${name}'s ${server} as ${JSON.stringify(transport)}, expected stdio ${declared.command} ${args.join(" ")}`);
      }
      for (const arg of args) if (arg.startsWith(installed) && !existsSync(arg)) failures.push(`${name}'s ${server} runs ${arg}, which the installed plugin does not contain`);
    } else if (transport.type !== declared.type.replace("-", "_") || transport.url !== declared.url) {
      failures.push(`Codex resolved ${name}'s ${server} as ${JSON.stringify(transport)}, expected ${declared.type} ${declared.url}`);
    }
  }
}
const resolvedServers = [...servers.keys()].sort();
if (resolvedServers.join() !== expectedServers.sort().join()) failures.push(`Codex resolved MCP servers [${resolvedServers.join(", ")}], expected [${expectedServers.join(", ")}]`);

if (failures.length) { console.error(failures.map((failure) => `check-codex: ${failure}`).join("\n")); process.exit(1); }
console.log(`check-codex: ok (${version}; schemas ${[...schemas.keys()].join(", ")}; skills ${resolvedSkills.join(", ")}; MCP servers ${resolvedServers.join(", ")})`);
