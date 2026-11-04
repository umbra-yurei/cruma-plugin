// Stages the repository-level eval corpus beside one plugin for Claude's eval CLI.
// Evals stay outside both shipped plugin trees; this script only copies files.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const plugin = process.argv[2];
if (!new Set(["cruma", "cruma-cloud"]).has(plugin)) {
  console.error("usage: node scripts/stage-evals.mjs <cruma|cruma-cloud>");
  process.exit(2);
}

const cloudPrefixes = ["board-", "cloud-", "memory-", "settings-"];
const belongsToPlugin = (name) => cloudPrefixes.some((prefix) => name.startsWith(prefix)) === (plugin === "cruma-cloud");
const stagedPlugin = join(root, ".eval-work", plugin);
rmSync(stagedPlugin, { recursive: true, force: true });
cpSync(join(root, "plugins", plugin), stagedPlugin, { recursive: true });
const stagedEvals = join(stagedPlugin, "evals");
mkdirSync(stagedEvals);
for (const entry of readdirSync(join(root, "evals"), { withFileTypes: true })) {
  if (entry.isDirectory() && (entry.name === "fake-cruma" || belongsToPlugin(entry.name))) {
    cpSync(join(root, "evals", entry.name), join(stagedEvals, entry.name), { recursive: true });
  }
}
console.log(stagedPlugin);
