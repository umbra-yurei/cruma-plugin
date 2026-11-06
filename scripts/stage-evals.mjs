// Stages the repository-level eval corpus beside one plugin for Claude's eval CLI.
// Evals stay outside the shipped plugin trees; this script only copies files.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const plugin = process.argv[2];
if (!new Set(["cruma", "cruma-local", "cruma-cloud"]).has(plugin)) {
  console.error("usage: node scripts/stage-evals.mjs <cruma|cruma-local|cruma-cloud>");
  process.exit(2);
}

const cloudPrefixes = ["board-", "cloud-", "memory-", "settings-"];
const directoryPrefix = "directory-";
const owner = (name) => (name === "mocks" ? "cruma-local" : cloudPrefixes.some((prefix) => name.startsWith(prefix)) ? "cruma-cloud" : name.startsWith(directoryPrefix) ? "cruma" : "cruma-local");

// The generated mocks are written under `plugin_cruma_cruma`; the eval CLI looks for
// `plugin_<plugin>_<server>`, and the bundled server's plugin is `cruma-local`.
const generatedMockDir = "plugin_cruma_cruma";
const stagedMockDir = "plugin_cruma-local_cruma";
const generatedToolPrefix = "mcp__plugin_cruma_cruma__";
const stagedToolPrefix = "mcp__plugin_cruma-local_cruma__";
function renameMockDirs(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(directory, entry.name);
    if (entry.name === generatedMockDir && !existsSync(join(directory, stagedMockDir))) renameSync(path, join(directory, stagedMockDir));
    else renameMockDirs(path);
  }
}

function prepareLocalEvalMocks(directory, toolsList) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === stagedMockDir && !existsSync(join(path, "_tools.json"))) {
        copyFileSync(toolsList, join(path, "_tools.json"));
      }
      prepareLocalEvalMocks(path, toolsList);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".yaml")) {
      const contents = readFileSync(path, "utf8");
      const staged = contents.replaceAll(generatedToolPrefix, stagedToolPrefix);
      if (staged !== contents) writeFileSync(path, staged);
    }
  }
}

// copyFileSync per file: `fs.cpSync` leaves unreadable files on some virtual filesystems.
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) copyTree(join(from, entry.name), join(to, entry.name));
    else copyFileSync(join(from, entry.name), join(to, entry.name));
  }
}

const stagedPlugin = join(root, ".eval-work", plugin);
rmSync(stagedPlugin, { recursive: true, force: true });
copyTree(join(root, "plugins", plugin), stagedPlugin);
const stagedEvals = join(stagedPlugin, "evals");
mkdirSync(stagedEvals, { recursive: true });
for (const entry of readdirSync(join(root, "evals"), { withFileTypes: true })) {
  if (entry.isDirectory() && (entry.name === "fake-cruma" || owner(entry.name) === plugin)) {
    copyTree(join(root, "evals", entry.name), join(stagedEvals, entry.name));
  }
}
renameMockDirs(stagedEvals);
if (plugin === "cruma-local") {
  prepareLocalEvalMocks(
    stagedEvals,
    join(stagedEvals, "mocks", stagedMockDir, "_tools.json"),
  );
}
console.log(stagedPlugin);
