// Checks the Codex eval runner's grading against the core cases' real graders, from a synthetic
// `codex exec --json` stream, and the `cruma mcp` stand-in over stdio. No Codex or model is run.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { grade, parseFrontmatter, runRecord, unwrapShell } from "./codex-grade.mjs";
import { root } from "./codex-tools.mjs";

const grader = (path) => parseFrontmatter(readFileSync(join(root, "evals", path), "utf8"));
const events = (...items) => items.map((item) => JSON.stringify({ type: "item.completed", item })).join("\n");
const message = (text) => ({ type: "agent_message", text });
const shell = (script) => ({ type: "command_execution", command: `/bin/bash -lc '${script.replaceAll("'", "'\\''")}'`, aggregated_output: "", exit_code: 0 });

test("frontmatter: single-quoted patterns, numbers, lists and nested tool_order", () => {
  assert.deepEqual(grader("expose-dev-server/graders/no-persist.md").fields, {
    type: "tool_used",
    tool: "mcp__plugin_cruma-local_cruma__upsert_backend",
    input_match: '"persist"\\s*:\\s*true',
    min: 0,
    max: 0,
  });
  assert.deepEqual(parseFrontmatter(readFileSync(join(root, "evals/directory-chat-no-shell/prompt.md"), "utf8")).fields.allowed_tools, ["Skill"]);
  assert.deepEqual(parseFrontmatter("---\ntype: tool_order\nbefore:\n  tool: a\nafter:\n  tool: b\n---\n").fields, { type: "tool_order", before: { tool: "a" }, after: { tool: "b" } });
});

test("a Codex shell command is graded as the command line Claude's Bash input carries", () => {
  assert.equal(unwrapShell("/bin/bash -lc 'curl -s http://localhost:3000'"), "curl -s http://localhost:3000");
  assert.equal(unwrapShell(`bash -lc 'echo '\\''hi'\\'''`), "echo 'hi'");
  assert.equal(unwrapShell("npm --version"), "npm --version");
  const asked = runRecord({
    events: events(shell("curl -s http://localhost:3000"), message("Cruma is not installed. Shall I run `npm install -g cruma`?")),
    plugin: "cruma",
  });
  for (const file of ["nothing-installed-yet", "npm-command", "asks-first", "no-script", "no-file-server"]) {
    assert.equal(grade(grader(`directory-agent-missing/graders/${file}.md`), asked).status, "pass", file);
  }
  const installed = runRecord({ events: events(shell("npm install -g cruma"), message("Installed.")), plugin: "cruma" });
  assert.equal(grade(grader("directory-agent-missing/graders/nothing-installed-yet.md"), installed).status, "fail");
});

test("a stand-in command missing from the event stream still counts as a Bash call", () => {
  const record = runRecord({ events: events(message("Done?")), plugin: "cruma", shimLog: "npm install -g cruma\n" });
  assert.equal(grade(grader("directory-agent-missing/graders/nothing-installed-yet.md"), record).status, "fail");
});

test("MCP calls are graded under Claude's plugin tool names and as mock_calls", () => {
  const record = runRecord({
    events: events(
      { type: "mcp_tool_call", server: "cruma", tool: "expose_local_port", arguments: { port: 3000 }, status: "completed" },
      { type: "mcp_tool_call", server: "cruma", tool: "get_health_summary", arguments: {}, status: "completed" },
      message("Shared https://port-3000.demo1234.tun.example.test"),
    ),
    plugin: "cruma-local",
    mockLog: [
      { method: "initialize" },
      { method: "tools/list" },
      { method: "tools/call", tool: "expose_local_port", arguments: { port: 3000 } },
      { method: "tools/call", tool: "get_health_summary", arguments: {} },
    ].map((entry) => JSON.stringify(entry)).join("\n"),
  });
  for (const file of ["exposed-port-3000", "health", "health-after-expose", "no-use-agent", "no-persist", "url-reported"]) {
    assert.equal(grade(grader(`expose-dev-server/graders/${file}.md`), record).status, "pass", file);
  }
  const judged = grade(grader("expose-dev-server/graders/handoff.md"), record);
  assert.equal(judged.status, "judge");
  assert.equal(judged.subject, "Shared https://port-3000.demo1234.tun.example.test");
});

test("a run that never reached the model reports why instead of grading", () => {
  const failed = runRecord({ events: JSON.stringify({ type: "turn.failed", error: { message: "401 Unauthorized" } }), plugin: "cruma" });
  assert.equal(failed.failure, "401 Unauthorized");
});

test("the `cruma mcp` stand-in lists _tools.json and answers with the case's mock, else the suite's", async () => {
  const log = join(mkdtempSync(join(tmpdir(), "codex-stand-in-")), "requests.jsonl");
  const server = spawn(process.execPath, [
    join(root, "scripts/codex-mcp-stand-in.mjs"),
    join(root, "evals/expose-dev-server/mocks/plugin_cruma-local_cruma"),
    join(root, "evals/mocks/plugin_cruma-local_cruma"),
    log,
  ]);
  const replies = [];
  let buffer = "";
  const done = new Promise((resolve) => server.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();
    replies.push(...lines.map((line) => JSON.parse(line)));
    if (replies.length === 4) resolve();
  }));
  const requests = [
    { id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
    { method: "notifications/initialized" },
    { id: 2, method: "tools/list" },
    { id: 3, method: "tools/call", params: { name: "list_agents", arguments: {} } },
    { id: 4, method: "tools/call", params: { name: "get_health_summary", arguments: {} } },
  ];
  for (const request of requests) server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...request })}\n`);
  await done;
  server.kill();
  const byId = Object.fromEntries(replies.map((reply) => [reply.id, reply.result]));
  assert.equal(byId[1].serverInfo.version, "99.0.0");
  assert.ok(byId[2].tools.some((tool) => tool.name === "expose_local_port"));
  assert.equal(byId[3].content[0].text, readFileSync(join(root, "evals/expose-dev-server/mocks/plugin_cruma-local_cruma/list_agents.md"), "utf8"));
  assert.equal(byId[4].content[0].text, readFileSync(join(root, "evals/mocks/plugin_cruma-local_cruma/get_health_summary.md"), "utf8"));
  assert.deepEqual(readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line).method), requests.map((request) => request.method));
});
