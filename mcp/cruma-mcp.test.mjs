import assert from "node:assert/strict";
import { test } from "node:test";
import { FORWARDED_NAMES, LAUNCHER_FLAG, buildEnvironment } from "./environment.mjs";
import { launch } from "./launcher.mjs";

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
  assert.deepEqual(starts, [{ executable: "/opt/cruma", args: ["mcp"], env: expected }]);
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
