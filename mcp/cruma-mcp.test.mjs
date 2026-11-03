import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { FORWARDED_NAMES, LAUNCHER_FLAG, buildEnvironment } from "./environment.mjs";

const launcher = join(dirname(fileURLToPath(import.meta.url)), "cruma-mcp.mjs");

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

test("the agent started by the launcher receives only allowlisted names", { skip: process.platform === "win32" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "cruma-launcher-"));
  try {
    const fake = join(directory, "cruma");
    writeFileSync(fake, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "cruma 99.0.0"; exit 0; fi\nenv\n');
    chmodSync(fake, 0o755);

    const result = spawnSync(process.execPath, [launcher], {
      env: { PATH: `${directory}:${process.env.PATH}`, HOME: directory, SECRET_TOKEN: "leak", ANTHROPIC_API_KEY: "leak" },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const names = result.stdout.split("\n").filter(Boolean).map((line) => line.slice(0, line.indexOf("=")));
    assert.ok(names.includes(LAUNCHER_FLAG));
    assert.ok(!result.stdout.includes("leak"));
    // `sh` adds PWD, SHLVL, OLDPWD and `_` itself; they are not inherited from the launcher.
    const shellOwn = new Set(["PWD", "OLDPWD", "SHLVL", "_"]);
    const unexpected = names.filter((name) => !shellOwn.has(name) && !FORWARDED_NAMES.includes(name) && name !== LAUNCHER_FLAG);
    assert.deepEqual(unexpected, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
