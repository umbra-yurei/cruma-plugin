import assert from "node:assert/strict";
import { test } from "node:test";
import { FORWARDED_NAMES, LAUNCHER_FLAG, buildEnvironment } from "./environment.mjs";
import { readFileSync } from "node:fs";
import { AGENT_CONTEXT_TIMEOUT_MS, ORIGIN_ARGS, launch, sessionNote } from "./launcher.mjs";

test("buildEnvironment keeps only allowlisted names and sets the launcher flag", () => {
  const environment = buildEnvironment({
    PATH: "/bin",
    HOME: "/home/user",
    ANTHROPIC_API_KEY: "secret",
    AWS_SECRET_ACCESS_KEY: "secret",
    CRUMA_TOKEN: "secret",
    GITHUB_TOKEN: "secret",
  });
  assert.deepEqual(environment, { PATH: "/bin", HOME: "/home/user", [LAUNCHER_FLAG]: "1" });
});

test("buildEnvironment lists exact names, never prefixes", () => {
  for (const name of FORWARDED_NAMES) assert.match(name, /^[A-Za-z0-9_]+$/);
  assert.equal(new Set(FORWARDED_NAMES).size, FORWARDED_NAMES.length);
});

test("the launcher gives the probe and the started agent exactly the allowlisted environment", () => {
  const source = { PATH: "/bin", HOME: "/home/user", ANTHROPIC_API_KEY: "secret", SECRET_TOKEN: "secret" };
  const expected = buildEnvironment(source);
  const probes = [];
  const starts = [];
  const exits = [];
  const child = { on() {}, kill() {} };
  launch({
    source,
    candidates: ["/opt/cruma"],
    spawnSync: (executable, args, options) => {
      probes.push({ executable, args, env: options.env });
      return { status: 0, stdout: "cruma 99.0.0" };
    },
    spawn: (executable, args, options) => {
      starts.push({ executable, args, env: options.env });
      return child;
    },
    exit: (code) => exits.push(code),
    onSignal() {},
    error() {},
  });
  assert.deepEqual(expected, { PATH: "/bin", HOME: "/home/user", [LAUNCHER_FLAG]: "1" });
  assert.deepEqual(probes, [{ executable: "/opt/cruma", args: ["--version"], env: expected }]);
  assert.deepEqual(starts, [{ executable: "/opt/cruma", args: ["mcp", ...ORIGIN_ARGS], env: expected }]);
  assert.deepEqual(exits, []);
});

test("the launcher exits 1 with install guidance and starts nothing when no agent answers", () => {
  const errors = [];
  const exits = [];
  launch({
    source: {},
    candidates: ["/opt/cruma"],
    spawnSync: () => ({ status: 1, stdout: "" }),
    spawn: () => assert.fail("nothing may be started"),
    exit: (code) => exits.push(code),
    onSignal() {},
    error: (message) => errors.push(message),
  });
  assert.deepEqual(exits, [1]);
  assert.match(errors[0], /not found/);
});

test("the launcher prefers the strictly newer install", () => {
  const versions = { "/old": "cruma 1.0.12", "/new": "cruma 1.0.17", "/same": "cruma 1.0.17" };
  const starts = [];
  launch({
    source: {},
    candidates: ["/old", "/new", "/same"],
    spawnSync: (executable) => ({ status: 0, stdout: versions[executable] }),
    spawn: (executable) => {
      starts.push(executable);
      return { on() {}, kill() {} };
    },
    exit() {},
    onSignal() {},
    error() {},
  });
  assert.deepEqual(starts, ["/new"]);
});

function startedArgs(version) {
  const starts = [];
  launch({
    source: {},
    candidates: ["/opt/cruma"],
    spawnSync: () => ({ status: 0, stdout: `cruma ${version}` }),
    spawn: (executable, args) => {
      starts.push(args);
      return { on() {}, kill() {} };
    },
    exit() {},
    onSignal() {},
    error() {},
  });
  return starts;
}

test("the launcher hands `cruma mcp` the fixed origin flag, and the configs pass the launcher no arguments", () => {
  for (const [file, key] of [[".mcp.json", "cruma"], ["mcp.json", "cruma"]]) {
    const parsed = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
    const args = (parsed.mcpServers ?? parsed)[key].args;
    assert.equal(args.length, 1, `${file} passes only the launcher file`);
    assert.match(args[0], /\/mcp\/cruma-mcp\.mjs$/);
  }
  assert.deepEqual(ORIGIN_ARGS, ["--origin", "plugin"]);
  assert.deepEqual(startedArgs("1.0.18"), [["mcp", "--origin", "plugin"]]);
  assert.deepEqual(startedArgs("2.0.0"), [["mcp", "--origin", "plugin"]]);
});

test("an agent older than the origin flag is started without it", () => {
  assert.deepEqual(startedArgs("1.0.17"), [["mcp"]]);
  assert.deepEqual(startedArgs("1.0.12"), [["mcp"]]);
});

test("the session note comes from `cruma agent-context` on the newest install, with the allowlisted environment", () => {
  const source = { PATH: "/bin", HOME: "/home/user", ANTHROPIC_API_KEY: "secret" };
  const versions = { "/old": "cruma 1.0.17", "/new": "cruma 1.0.18" };
  const calls = [];
  const note = sessionNote({
    source,
    candidates: ["/old", "/new"],
    spawnSync: (executable, args, options) => {
      calls.push({ executable, args, env: options.env, timeout: options.timeout });
      if (args[0] === "--version") return { status: 0, stdout: versions[executable] };
      return { status: 0, stdout: "Cruma coding-agent settings for this user\n" };
    },
  });
  assert.equal(note, "Cruma coding-agent settings for this user");
  assert.deepEqual(calls.at(-1), {
    executable: "/new",
    args: ["agent-context"],
    env: buildEnvironment(source),
    timeout: AGENT_CONTEXT_TIMEOUT_MS,
  });
});

test("the session note is empty without an agent, on a failing or silent `agent-context`", () => {
  const cases = [
    { version: { status: 1, stdout: "" }, context: undefined },
    { version: { status: 0, stdout: "cruma 1.0.17" }, context: { status: 2, stdout: "error: unrecognized subcommand" } },
    { version: { status: 0, stdout: "cruma 1.0.18" }, context: { status: null, stdout: "partial", signal: "SIGTERM" } },
    { version: { status: 0, stdout: "cruma 1.0.18" }, context: { status: 0, stdout: "" } },
  ];
  for (const { version, context } of cases) {
    const note = sessionNote({
      source: {},
      candidates: ["/opt/cruma"],
      spawnSync: (_executable, args) => {
        if (args[0] === "--version") return version;
        assert.ok(context, "agent-context runs only when an agent was found");
        return context;
      },
    });
    assert.equal(note, "");
  }
});
