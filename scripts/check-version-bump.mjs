// Fails when a file under plugins/<name>/ differs from the base branch but that plugin's
// version (in plugin.json) does not differ: installs cache by version, so an unbumped change
// never reaches users. BASE_REF overrides the base (default origin/main, then main).
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };

const candidates = process.env.BASE_REF ? [process.env.BASE_REF] : ["origin/main", "main"];
const base = candidates.find((ref) => tryGit("rev-parse", "--verify", `${ref}^{commit}`) !== null);
if (!base) {
  console.error(`check-version-bump: no base ref found (tried ${candidates.join(", ")}); fetch full history`);
  process.exit(1);
}
const mergeBase = tryGit("merge-base", base, "HEAD");
if (!mergeBase) {
  console.error(`check-version-bump: no merge base with ${base}; fetch full history`);
  process.exit(1);
}
if (mergeBase === git("rev-parse", "HEAD")) {
  console.log("check-version-bump: HEAD is on the base branch, nothing to compare");
  process.exit(0);
}

const versionAt = (rev, plugin) => {
  const text = tryGit("show", `${rev}:plugins/${plugin}/plugin.json`);
  return text === null ? null : JSON.parse(text).version;
};

const failures = [];
for (const plugin of readdirSync("plugins", { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
  const changed = git("diff", "--name-only", mergeBase, "HEAD", "--", `plugins/${plugin}/`)
    .split("\n").filter(Boolean)
    .filter((file) => !file.endsWith("/plugin.json"));
  const manifestChanged = git("diff", "--name-only", mergeBase, "HEAD", "--", `plugins/${plugin}/plugin.json`, `plugins/${plugin}/.claude-plugin/plugin.json`).length > 0;
  if (changed.length === 0 && !manifestChanged) continue;
  const before = versionAt(mergeBase, plugin);
  const after = versionAt("HEAD", plugin);
  if (before !== null && before === after && changed.length > 0) {
    failures.push(`plugins/${plugin} changed (${changed.slice(0, 3).join(", ")}${changed.length > 3 ? ", ..." : ""}) but its version is still ${after}; bump it in plugin.json and .claude-plugin/plugin.json`);
  }
}
if (failures.length) {
  for (const f of failures) console.error(`check-version-bump: ${f}`);
  process.exit(1);
}
console.log(`check-version-bump: ok against ${base}`);
