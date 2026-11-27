// Runs evals/ cases in Codex (`codex exec`, non-interactive) with the plugin installed from this
// checkout, the same scaffold and PATH isolation as the Claude cases, and the case's own graders.
// See README "### Running cases in Codex".
//   node scripts/codex-eval.mjs [--dry-run] [--no-judge] [--model <model>] [--sandbox <mode>] [--case <name>]...
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { JUDGE_SCHEMA, grade, judgePrompt, parseFrontmatter, runRecord } from "./codex-grade.mjs";
import { BASH_TOOL, EVAL_WORK, LOCAL_MOCK_DIR, LOCAL_PLUGIN, LOCAL_SERVER, MARKETPLACE_FILE, MCP_TOOL_PREFIX, SKILL_TOOL, STAND_IN_VERSION, owner, root, stagedPluginDir } from "./eval-cases.mjs";
import { mcpApprovalConfig } from "./codex-config.mjs";
import { ensureTools, runCodex } from "./codex-tools.mjs";

// Share a port, agent missing, no shell.
const CORE_CASES = ["expose-dev-server", "directory-agent-missing", "directory-chat-no-shell"];

const options = { cases: [], dryRun: false, judge: true, model: undefined, sandbox: "workspace-write" };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  if (flag === "--dry-run") options.dryRun = true;
  else if (flag === "--no-judge") options.judge = false;
  else if (flag === "--case") options.cases.push(argv[++index]);
  else if (flag === "--model") options.model = argv[++index];
  else if (flag === "--sandbox") options.sandbox = argv[++index];
  else {
    console.error("usage: node scripts/codex-eval.mjs [--dry-run] [--no-judge] [--model <model>] [--sandbox <mode>] [--case <name>]...");
    process.exit(2);
  }
}
if (!options.cases.length) options.cases = CORE_CASES;

const { codex } = ensureTools();
const marketplace = JSON.parse(readFileSync(MARKETPLACE_FILE, "utf8")).name;
const modelArgs = options.model ? ["--model", options.model] : [];
const userAuth = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "auth.json");
const shellQuote = (value) => (/^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`);
const tomlString = (value) => JSON.stringify(value);

function codexOk(args, context) {
  const result = runCodex(codex, args, context);
  if (result.status !== 0) throw new Error(`codex ${args.join(" ")} exited ${result.status}:\n${result.stderr}`);
  return result.stdout;
}

// A fresh CODEX_HOME holding only the login (if the caller has one) and nothing else.
function freshCodexHome(directory) {
  mkdirSync(directory, { recursive: true });
  if (existsSync(userAuth)) copyFileSync(userAuth, join(directory, "auth.json"));
}

const staged = new Set();
function stageCase(name) {
  const plugin = owner(name);
  if (!staged.has(plugin)) {
    const stage = spawnSync(process.execPath, [join(root, "scripts/stage-evals.mjs"), plugin], { stdio: ["ignore", "ignore", "inherit"] });
    if (stage.status !== 0) throw new Error(`staging ${plugin} failed`);
    staged.add(plugin);
  }
  const caseDir = join(stagedPluginDir(plugin), "evals", name);
  if (!existsSync(join(caseDir, "prompt.md"))) throw new Error(`${name}: no staged prompt.md for the ${plugin} plugin`);
  return { plugin, caseDir };
}

// Codex reads a skill's SKILL.md with its shell, so its shell is the equivalent of Claude's Skill
// tool too. A case that allows Bash gets a writable shell (the run's home included, where the
// scaffold's stand-ins log); one that allows only Skill gets a read-only shell, which can read the
// skill but install, write or start nothing; one that allows neither gets no shell.
function shellArgs(allowed, home) {
  if (allowed.includes(BASH_TOOL)) return ["--sandbox", options.sandbox, "--add-dir", home];
  if (allowed.includes(SKILL_TOOL)) return ["--sandbox", "read-only"];
  return ["--sandbox", "read-only", "--disable", "shell_tool", "--disable", "unified_exec"];
}

function prepare(name) {
  const { plugin, caseDir } = stageCase(name);
  const { fields: prompt, body } = parseFrontmatter(readFileSync(join(caseDir, "prompt.md"), "utf8"));
  const allowed = prompt.allowed_tools ?? [SKILL_TOOL, BASH_TOOL];
  const unknown = allowed.filter((tool) => tool !== SKILL_TOOL && tool !== BASH_TOOL && !tool.startsWith(MCP_TOOL_PREFIX));
  if (unknown.length) throw new Error(`${name}: allowed tools ${unknown.join(", ")} have no Codex equivalent in this runner`);
  // The one MCP server the runner stands in for is cruma-local's (see codex-mcp-stand-in.mjs).
  const mockDirs = existsSync(join(caseDir, "mocks")) ? readdirSync(join(caseDir, "mocks")) : [];
  if (mockDirs.some((directory) => directory !== LOCAL_MOCK_DIR)) throw new Error(`${name}: mocks for ${mockDirs.join(", ")}; the Codex runner stands in only for ${LOCAL_MOCK_DIR}`);

  const run = join(EVAL_WORK, "codex", name);
  rmSync(run, { recursive: true, force: true });
  const codexHome = join(run, "codex-home");
  const home = join(run, "home");
  const workspace = join(run, "workspace");
  for (const directory of [home, workspace]) mkdirSync(directory, { recursive: true });
  freshCodexHome(codexHome);
  codexOk(["plugin", "marketplace", "add", root, "--json"], { codexHome, home, cwd: home });
  const pluginId = `${plugin}@${marketplace}`;
  codexOk(["plugin", "add", pluginId, "--json"], { codexHome, home, cwd: home });
  // Approve exactly the case's declared MCP tools, as the Claude arm's grant does.
  const approvals = mcpApprovalConfig(allowed, plugin, pluginId);
  if (approvals) appendFileSync(join(codexHome, "config.toml"), `\n# codex-eval: the case's allowed MCP tools\n${approvals}`);

  const scaffold = /^\s*scaffold_script:\s*(\S+)\s*$/m.exec(existsSync(join(caseDir, "case.yaml")) ? readFileSync(join(caseDir, "case.yaml"), "utf8") : "")?.[1];
  if (scaffold) {
    const result = spawnSync("bash", [join(caseDir, scaffold)], { cwd: workspace, env: { ...process.env, HOME: home }, stdio: ["ignore", "inherit", "inherit"] });
    if (result.status !== 0) throw new Error(`${name}: scaffold ${scaffold} exited ${result.status}`);
  }

  const bin = join(home, ".local", "bin");
  const mockLog = join(run, "mcp-requests.jsonl");
  if (plugin === LOCAL_PLUGIN) {
    // The launcher prefers the newest `cruma` it finds, and 99.0.0 beats any real install.
    const standInPath = join(bin, LOCAL_SERVER);
    if (existsSync(standInPath)) throw new Error(`${name}: its scaffold writes a cruma of its own; the Codex runner cannot also stand in for \`cruma mcp\``);
    mkdirSync(bin, { recursive: true });
    const standIn = [process.execPath, join(root, "scripts/codex-mcp-stand-in.mjs"), join(caseDir, "mocks", LOCAL_MOCK_DIR), join(caseDir, "..", "mocks", LOCAL_MOCK_DIR), mockLog].map(shellQuote).join(" ");
    writeFileSync(standInPath, `#!/bin/sh\ncase "$1" in\n  --version) echo "cruma ${STAND_IN_VERSION}" ;;\n  mcp) exec ${standIn} ;;\n  *) echo "cruma (eval stand-in): only --version and mcp" >&2; exit 2 ;;\nesac\n`);
    chmodSync(standInPath, 0o755);
    writeFileSync(mockLog, "");
  }

  const promptFile = join(run, "prompt.txt");
  writeFileSync(promptFile, body.trim() + "\n");
  const lastMessage = join(run, "last-message.txt");
  const args = [
    "exec", "--json", "--ephemeral", "--skip-git-repo-check",
    "--cd", workspace,
    ...shellArgs(allowed, home),
    // Commands the agent runs see only the run's ~/.local/bin, /usr/bin and /bin, like the
    // Claude cases' .claude/settings.json PATH.
    "-c", 'shell_environment_policy.inherit="core"',
    "-c", `shell_environment_policy.set={ PATH = ${tomlString(`${bin}:/usr/bin:/bin`)}, HOME = ${tomlString(home)} }`,
    ...modelArgs,
    "-o", lastMessage,
    "-",
  ];
  const command = `cd ${shellQuote(workspace)} && CODEX_HOME=${shellQuote(codexHome)} HOME=${shellQuote(home)} ${[codex, ...args].map(shellQuote).join(" ")} < ${shellQuote(promptFile)}`;
  return { name, plugin, caseDir, run, allowed, approvals, codexHome, home, workspace, args, command, promptFile, lastMessage, mockLog, timeout: (prompt.timeout_seconds ?? 300) * 1000 };
}

function judge(verdict, run, index) {
  const directory = join(run, "judge", String(index));
  freshCodexHome(join(directory, "codex-home"));
  const schema = join(directory, "schema.json");
  const answer = join(directory, "verdict.json");
  writeFileSync(schema, JSON.stringify(JUDGE_SCHEMA));
  const result = runCodex(
    codex,
    ["exec", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--disable", "shell_tool", "--disable", "unified_exec", ...modelArgs, "--output-schema", schema, "-o", answer, "-"],
    { codexHome: join(directory, "codex-home"), home: directory, cwd: directory, input: judgePrompt(verdict), timeout: 300_000 },
  );
  if (result.status !== 0 || !existsSync(answer)) return { status: "unsupported", detail: `judge did not answer (exit ${result.status})` };
  const { pass, reason } = JSON.parse(readFileSync(answer, "utf8"));
  return { status: pass ? "pass" : "fail", detail: reason };
}

let exitCode = 0;
const summary = [];
for (const name of options.cases) {
  const prepared = prepare(name);
  console.log(`\n== ${name} (${prepared.plugin})\n${prepared.command}`);
  if (prepared.approvals) console.log(`approved in ${join(prepared.codexHome, "config.toml")}:\n${prepared.approvals}`);
  if (options.dryRun) {
    summary.push([name, "staged", "-"]);
    continue;
  }
  const result = runCodex(codex, prepared.args, { codexHome: prepared.codexHome, home: prepared.home, cwd: prepared.workspace, input: readFileSync(prepared.promptFile), timeout: prepared.timeout });
  writeFileSync(join(prepared.run, "events.jsonl"), result.stdout ?? "");
  writeFileSync(join(prepared.run, "stderr.txt"), result.stderr ?? "");
  const shimLog = join(prepared.home, ".local/share/directory-shims/calls.log");
  const record = runRecord({
    events: result.stdout ?? "",
    plugin: prepared.plugin,
    lastMessage: existsSync(prepared.lastMessage) ? readFileSync(prepared.lastMessage, "utf8") : "",
    mockLog: existsSync(prepared.mockLog) ? readFileSync(prepared.mockLog, "utf8") : "",
    shimLog: existsSync(shimLog) ? readFileSync(shimLog, "utf8") : "",
  });
  const mcpRequests = existsSync(prepared.mockLog) ? readFileSync(prepared.mockLog, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line).method) : [];
  if (mcpRequests.length) console.log(`MCP stand-in requests: ${mcpRequests.join(", ")}`);
  if (result.error || record.failure || !record.response) {
    console.log(`NOT RUN: ${result.error?.message ?? record.failure ?? `codex exited ${result.status} with no reply`}`);
    summary.push([name, "not run", "-"]);
    exitCode = Math.max(exitCode, 2);
    continue;
  }
  if (record.approvalRefusals.length) {
    // A config gap, not a skill failure: never grade a run whose tools Codex would not call.
    const refusals = record.approvalRefusals.map(({ tool, message }) => `  ${tool} (${prepared.allowed.includes(tool) ? "in allowed_tools: the runner's config failed to approve it" : "not in allowed_tools"}): ${message}`);
    console.log(`NOT RUN: Codex refused ${refusals.length} call(s) as needing approval, so the graders would score the runner's config, not the skill:\n${refusals.join("\n")}`);
    summary.push([name, "config gap", "-"]);
    exitCode = Math.max(exitCode, 2);
    continue;
  }
  const graders = readdirSync(join(prepared.caseDir, "graders")).filter((file) => file.endsWith(".md")).sort();
  const results = graders.map((file, index) => {
    let verdict = grade(parseFrontmatter(readFileSync(join(prepared.caseDir, "graders", file), "utf8")), record);
    if (verdict.status === "judge") verdict = options.judge ? judge(verdict, prepared.run, index) : { status: "unsupported", detail: "llm grader (--no-judge)" };
    console.log(`  ${{ pass: "✓", fail: "✗" }[verdict.status] ?? "?"} ${file}: ${verdict.detail}`);
    return { grader: file, ...verdict };
  });
  writeFileSync(join(prepared.run, "results.json"), JSON.stringify({ case: name, results, response: record.response }, null, 2));
  const passed = results.filter((entry) => entry.status === "pass").length;
  summary.push([name, passed === results.length ? "pass" : "fail", `${passed}/${results.length}`]);
  if (passed !== results.length) exitCode = Math.max(exitCode, 1);
}

console.log("\nCASE\tRESULT\tGRADERS");
for (const row of summary) console.log(row.join("\t"));
process.exit(exitCode);
