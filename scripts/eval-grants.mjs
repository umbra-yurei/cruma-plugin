#!/usr/bin/env node
// Which tools `claude plugin eval` is granted for each directory-* case: exactly the gated ones the case's
// prompt.md `allowed_tools` declares, never a suite-wide grant.
//   node scripts/eval-grants.mjs [--case <glob>]   one line per case: <name>, then each tool to grant, TAB-separated
// `Skill`, `Read`, `Glob` and `Grep` are available to every run without a grant, and an `mcp__*` tool of
// a case is answered by the case's own mocks, so none of them is passed to `--allow-tools`.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./codex-grade.mjs";
import { DIRECTORY_PLUGIN, MCP_TOOL_PREFIX, SKILL_TOOL, owner, root } from "./eval-cases.mjs";

const UNGATED_TOOLS = new Set([SKILL_TOOL, "Read", "Glob", "Grep"]);

export function grantedTools(allowedTools) {
  return allowedTools.filter((tool) => !UNGATED_TOOLS.has(tool) && !tool.startsWith(MCP_TOOL_PREFIX));
}

// `*` and `?` only, like the harness's own --case filter for these names.
export function globMatches(glob, name) {
  const pattern = glob.split("").map((char) => (char === "*" ? ".*" : char === "?" ? "." : char.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&"))).join("");
  return new RegExp(`^${pattern}$`).test(name);
}

// A case that declares no allowed_tools gets none, the harness's own default.
export function directoryCases(glob = "directory-*", evalsDir = join(root, "evals")) {
  return readdirSync(evalsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && owner(entry.name) === DIRECTORY_PLUGIN && existsSync(join(evalsDir, entry.name, "prompt.md")) && globMatches(glob, entry.name))
    .map((entry) => {
      const { fields } = parseFrontmatter(readFileSync(join(evalsDir, entry.name, "prompt.md"), "utf8"));
      return { name: entry.name, grant: grantedTools(fields.allowed_tools ?? []) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 0 && !(args[0] === "--case" && args.length === 2)) {
    console.error("usage: eval-grants.mjs [--case <glob>]");
    process.exit(2);
  }
  for (const { name, grant } of directoryCases(args[1])) console.log([name, ...grant].join("\t"));
}
