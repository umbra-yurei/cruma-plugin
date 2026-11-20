// The Codex CLI and JSON Schema validator that scripts/check-codex.mjs and scripts/codex-eval.mjs
// use, pinned the way .github/workflows/validate.yml pins Claude Code. They are installed once
// into .eval-work/tools (ignored by git), never into the plugin trees.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const CODEX_VERSION = "0.171.0";
export const AJV_VERSION = "8.17.1";

const tools = join(root, ".eval-work", "tools");

function installedVersion(name) {
  const manifest = join(tools, "node_modules", name, "package.json");
  return existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).version : undefined;
}

// `{ codex, requireTool }`: the pinned `codex` executable and a `require` that resolves the pinned
// packages (`requireTool("ajv/dist/2020")`).
export function ensureTools() {
  if (installedVersion("@openai/codex") !== CODEX_VERSION || installedVersion("ajv") !== AJV_VERSION) {
    const install = spawnSync(
      "npm",
      ["install", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", "--prefix", tools, `@openai/codex@${CODEX_VERSION}`, `ajv@${AJV_VERSION}`],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    if (install.status !== 0) throw new Error(`npm install of @openai/codex@${CODEX_VERSION} and ajv@${AJV_VERSION} failed`);
  }
  return { codex: join(tools, "node_modules", ".bin", "codex"), requireTool: createRequire(join(tools, "package.json")) };
}

// Runs the pinned `codex` with its own CODEX_HOME and HOME, so nothing of the caller's Codex
// configuration, plugins or skills is read. Returns spawnSync's result (utf8).
export function runCodex(codex, args, { codexHome, home, cwd, input, timeout } = {}) {
  return spawnSync(codex, args, {
    cwd,
    env: { ...process.env, CODEX_HOME: codexHome, HOME: home },
    input,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout,
  });
}
