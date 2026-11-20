// Runs evals/ cases in Codex (`codex exec`, non-interactive) with the plugin installed from this
// checkout, the same scaffold and PATH isolation as the Claude cases, and the case's own graders.
// See README "### Running cases in Codex".
//   node scripts/codex-eval.mjs [--dry-run] [--no-judge] [--model <model>] [--sandbox <mode>] [--case <name>]...
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { JUDGE_SCHEMA, grade, judgePrompt, parseFrontmatter, runRecord } from "./codex-grade.mjs";
import { owner } from "./eval-cases.mjs";
import { ensureTools, root, runCodex } from "./codex-tools.mjs";

// Share a port, agent missing, no shell.
const CORE_CASES = ["expose-dev-server", "directory-agent-missing", "directory-chat-no-shell"];
// The one MCP server the runner can stand in for: cruma-local's `cruma` (see codex-mcp-stand-in.mjs).
const STAND_IN_MOCKS = "plugin_cruma-local_cruma";

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
const marketplace = JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")).name;
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
  const caseDir = join(root, ".eval-work", plugin, "evals", name);
  if (!existsSync(join(caseDir, "prompt.md"))) throw new Error(`${name}: no staged prompt.md for the ${plugin} plugin`);
  return { plugin, caseDir };
}

// Codex reads a skill's SKILL.md with its shell, so its shell is the equivalent of Claude's Skill
// tool too. A case that allows Bash gets a writable shell (the run's home included, where the
// scaffold's stand-ins log); one that allows only Skill gets a read-only shell, which can read the
// skill but install, write or start nothing; one that allows neither gets no shell.
function shellArgs(allowed, home) {
  if (allowed.includes("Bash")) return ["--sandbox", options.sandbox, "--add-dir", home];
  if (allowed.includes("Skill")) return ["--sandbox", "read-only"];
  return ["--sandbox", "read-only", "--disable", "shell_tool", "--disable", "unified_exec"];
}

function prepare(name) {
  const { plugin, caseDir } = stageCase(name);
  const { fields: prompt, body } = parseFrontmatter(readFileSync(join(caseDir, "prompt.md"), "utf8"));
  const allowed = prompt.allowed_tools ?? ["Skill", "Bash"];
  const unknown = allowed.filter((tool) => tool !== "Skill" && tool !== "Bash" && !tool.startsWith("mcp__"));
  if (unknown.length) throw new Error(`${name}: allowed tools ${unknown.join(", ")} have no Codex equivalent in this runner`);
  const mockDirs = existsSync(join(caseDir, "mocks")) ? readdirSync(join(caseDir, "mocks")) : [];
  if (mockDirs.some((directory) => directory !== STAND_IN_MOCKS)) throw new Error(`${name}: mocks for ${mockDirs.join(", ")}; the Codex runner stands in only for ${STAND_IN_MOCKS}`);

  const run = join(root, ".eval-work", "codex", name);
  rmSync(run, { recursive: true, force: true });
  const codexHome = join(run, "codex-home");
  const home = join(run, "home");
  const workspace = join(run, "workspace");
  for (const directory of [home, workspace]) mkdirSync(directory, { recursive: true });
  freshCodexHome(codexHome);
  codexOk(["plugin", "marketplace", "add", root, "--json"], { codexHome, home, cwd: home });
  codexOk(["plugin", "add", `${plugin}@${marketplace}`, "--json"], { codexHome, home, cwd: home });

  const scaffold = /^\s*scaffold_script:\s*(\S+)\s*$/m.exec(existsSync(join(caseDir, "case.yaml")) ? readFileSync(join(caseDir, "case.yaml"), "utf8") : "")?.[1];
  if (scaffold) {
    const result = spawnSync("bash", [join(caseDir, scaffold)], { cwd: workspace, env: { ...process.env, HOME: home }, stdio: ["ignore", "inherit", "inherit"] });
    if (result.status !== 0) throw new Error(`${name}: scaffold ${scaffold} exited ${result.status}`);
  }

  const bin = join(home, ".local", "bin");
  const mockLog = join(run, "mcp-requests.jsonl");
  if (plugin === "cruma-local") {
    // The launcher prefers the newest `cruma` it finds, and 99.0.0 beats any real install.
    if (existsSync(join(bin, "cruma"))) throw new Error(`${name}: its scaffold writes a cruma of its own; the Codex runner cannot also stand in for \`cruma mcp\``);
    mkdirSync(bin, { recursive: true });
    const standIn = [process.execPath, join(root, "scripts/codex-mcp-stand-in.mjs"), join(caseDir, "mocks", STAND_IN_MOCKS), join(caseDir, "..", "mocks", STAND_IN_MOCKS), mockLog].map(shellQuote).join(" ");
    writeFileSync(join(bin, "cruma"), `#!/bin/sh\ncase "$1" in\n  --version) echo "cruma 99.0.0" ;;\n  mcp) exec ${standIn} ;;\n  *) echo "cruma (eval stand-in): only --version and mcp" >&2; exit 2 ;;\nesac\n`);
    chmodSync(join(bin, "cruma"), 0o755);
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
  return { name, plugin, caseDir, run, codexHome, home, workspace, args, command, promptFile, lastMessage, mockLog, timeout: (prompt.timeout_seconds ?? 300) * 1000 };
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
