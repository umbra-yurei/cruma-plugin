// Checks the directory-* eval isolation without a model: which tools each case is granted, what the
// trace scanner counts as the host leaking in, and that the scaffold's stand-ins hide the host's Cruma app.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { directoryCases, globMatches, grantedTools } from "./eval-grants.mjs";
import { root } from "./eval-cases.mjs";

test("a case is granted exactly the gated tools it declares", () => {
  assert.deepEqual(grantedTools(["Skill"]), []);
  assert.deepEqual(grantedTools(["Skill", "Bash"]), ["Bash"]);
  assert.deepEqual(grantedTools(["Skill", "Bash(npm test:*)", "Write"]), ["Bash(npm test:*)", "Write"]);
  assert.deepEqual(grantedTools(["Skill", "mcp__cruma__list_shares"]), []);
  assert.deepEqual(grantedTools([]), []);
});

test("the directory-* cases that declare [Skill] only get no Bash, the others get Bash", () => {
  const grants = Object.fromEntries(directoryCases().map(({ name, grant }) => [name, grant]));
  for (const name of ["directory-chat-no-shell", "directory-install-macos-download-page", "directory-install-macos-npm", "directory-install-windows-npm", "directory-mcp-present"]) {
    assert.deepEqual(grants[name], [], name);
  }
  for (const name of ["directory-agent-missing", "directory-chat-sandbox", "directory-cli-same-session", "directory-sandbox-install-fails"]) {
    assert.deepEqual(grants[name], ["Bash"], name);
  }
  assert.deepEqual(directoryCases("directory-install-macos-*").map(({ name }) => name), ["directory-install-macos-download-page", "directory-install-macos-npm"]);
  assert.deepEqual(directoryCases("directory-chat-no-shell").map(({ name }) => name), ["directory-chat-no-shell"]);
  assert.deepEqual(directoryCases("nothing-*"), []);
});

test("the case glob knows * and ? and takes every other character literally", () => {
  assert.ok(globMatches("directory-*", "directory-chat-no-shell"));
  assert.ok(globMatches("directory-chat-?", "directory-chat-x"));
  assert.ok(!globMatches("directory-chat", "directory-chat-no-shell"));
  assert.ok(!globMatches("a.c", "abc"));
});

// One run's trace holding the given tool results, scanned for a case whose scaffold is `mode`.
function scan(mode, ...outputs) {
  const dir = mkdtempSync(join(tmpdir(), "scan-"));
  const caseDir = join(dir, "case");
  mkdirSync(caseDir);
  writeFileSync(join(caseDir, "scaffold.sh"), `exec bash "$here/../fake-cruma/directory-shims.sh" ${mode}\n`);
  const tracePath = join(dir, "out", "trace.jsonl");
  mkdirSync(join(dir, "out"));
  writeFileSync(tracePath, outputs.map((text) => JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: text }] } })).join("\n"));
  const result = join(dir, "result.json");
  writeFileSync(result, JSON.stringify({ suite: { root: dir }, cases: [{ name: "case", dir: "case", arms: { with: [{ tracePath }] } }] }));
  const run = spawnSync("node", [join(root, "scripts/scan-eval-trace.mjs"), result], { encoding: "utf8" });
  return { status: run.status, out: run.stdout };
}

test("the scanner fails a run whose output shows the host's Cruma app", () => {
  for (const output of [
    "/Applications/Cruma.app",
    "/Applications/Cruma.app\n/Users/dev/Applications/Cruma.app",
    '{"version":"1.0.19","build_flavor":"gui"}',
    '{ "build_flavor" : "gui" }',
    "/Applications/Cruma.app/Contents/MacOS/cruma",
  ]) {
    const run = scan("macos-bare", output);
    assert.equal(run.status, 1, output);
    assert.match(run.out, /^leak case with#1 .*: \d+ x /m, output);
  }
  assert.match(scan("missing", "/Applications/Cruma.app").out, /1 x \/Applications\/Cruma\.app/);
  assert.match(scan("missing", '{"build_flavor":"gui"}').out, /1 x "build_flavor":"gui"/);
});

test("the scanner passes the stand-in's own answers", () => {
  for (const output of [
    "ls: cannot access '/Applications/Cruma.app': No such file or directory\nls: cannot access '/home/x/Applications/Cruma.app': No such file or directory",
    "ls: /Applications/Cruma.app: No such file or directory",
    "Unable to find application named 'Cruma'",
    '{"version":"1.0.17","build_flavor":"server-agent"}',
    "cruma 1.0.17",
  ]) {
    const run = scan("macos-bare", output);
    assert.equal(run.status, 0, output);
    assert.match(run.out, /^tool_results 1$/m);
  }
  assert.equal(scan("macos", "Darwin").status, 0);
  assert.equal(scan("missing", "Darwin").status, 1);
});

test("the stand-in ls and open hide the host's Cruma app, and the Mac workspace settings deny reading it", () => {
  const dir = mkdtempSync(join(tmpdir(), "shims-"));
  const apps = join(dir, "Applications");
  for (const app of ["Cruma.app/Contents", "Other.app"]) mkdirSync(join(apps, app), { recursive: true });
  const home = join(dir, "home");
  const workspace = join(dir, "workspace");
  mkdirSync(home);
  mkdirSync(workspace);
  const scaffold = spawnSync("bash", [join(root, "evals/fake-cruma/directory-shims.sh"), "macos"], {
    cwd: workspace,
    env: { HOME: home, PATH: process.env.PATH, DIRECTORY_SHIMS_HOST_APPS: apps },
    encoding: "utf8",
  });
  assert.equal(scaffold.status, 0, scaffold.stderr);
  const bin = join(home, ".local/bin");
  const run = (tool, ...args) => spawnSync(join(bin, tool), args, { encoding: "utf8" });

  const check = run("ls", "-d", join(apps, "Cruma.app"), join(home, "Applications/Cruma.app"));
  assert.notEqual(check.status, 0);
  assert.equal(check.stdout, "");
  assert.match(check.stderr, /No such file or directory/);
  assert.notEqual(run("ls", "-d", join(apps, "Cruma.app/Contents")).status, 0);
  assert.notEqual(run("ls", "-d", join(apps, "Cruma*")).status, 0);
  assert.equal(run("ls", apps).stdout, "Other.app\n");
  assert.equal(run("ls", "-1", `${apps}/`).stdout, "Other.app\n");
  assert.equal(run("ls", "-d", join(apps, "Other.app")).stdout, `${join(apps, "Other.app")}\n`);
  assert.equal(run("open", "-a", "Cruma").status, 1);
  assert.match(run("open", "-a", "Cruma").stderr, /Unable to find application/);

  const settings = readFileSync(join(workspace, ".claude/settings.json"), "utf8");
  assert.deepEqual(JSON.parse(settings).sandbox.filesystem.denyRead, [join(apps, "Cruma.app")]);
});
