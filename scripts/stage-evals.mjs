// Stages the repository-level eval corpus beside one plugin for Claude's eval CLI.
// Evals stay outside the shipped plugin trees; this script only copies files.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIRECTORY_PLUGIN, LOCAL_MOCK_DIR, LOCAL_PLUGIN, LOCAL_SERVER, PLUGINS, mcpToolName, owner, root, stagedPluginDir } from "./eval-cases.mjs";

const plugin = process.argv[2];
if (!PLUGINS.includes(plugin)) {
  console.error("usage: node scripts/stage-evals.mjs <cruma|cruma-local|cruma-cloud>");
  process.exit(2);
}

const stagedMockDir = LOCAL_MOCK_DIR;
const generatedToolPrefix = mcpToolName(DIRECTORY_PLUGIN, LOCAL_SERVER);
const stagedToolPrefix = mcpToolName(LOCAL_PLUGIN, LOCAL_SERVER);

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

const stagedPlugin = stagedPluginDir(plugin);
rmSync(stagedPlugin, { recursive: true, force: true });
copyTree(join(root, "plugins", plugin), stagedPlugin);
const stagedEvals = join(stagedPlugin, "evals");
mkdirSync(stagedEvals, { recursive: true });
for (const entry of readdirSync(join(root, "evals"), { withFileTypes: true })) {
  if (entry.isDirectory() && (entry.name === "fake-cruma" || owner(entry.name) === plugin)) {
    copyTree(join(root, "evals", entry.name), join(stagedEvals, entry.name));
  }
}
if (plugin === LOCAL_PLUGIN) {
  prepareLocalEvalMocks(
    stagedEvals,
    join(stagedEvals, "mocks", stagedMockDir, "_tools.json"),
  );
}
console.log(stagedPlugin);
