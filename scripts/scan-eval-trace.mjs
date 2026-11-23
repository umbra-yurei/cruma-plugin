#!/usr/bin/env node
// Scans the runs of a `claude plugin eval --json <file>` result for the host leaking into the agent's Bash.
//   node scripts/scan-eval-trace.mjs <result.json>          scan; exit 1 on a leak or an unscannable run
//   node scripts/scan-eval-trace.mjs --dirs <result.json>   print each run's temp directory, one per line
// The traces come from the result's own `tracePath` fields, never from the harness's log wording or
// temp-directory names. Only tool results count (what the agent's commands printed), never the model's
// own words or the harness's session records. A sandbox failure (`Operation not permitted`, `Read-only file
// system`, `apply-seccomp`, a bwrap or sandbox-exec start-up error) counts like a leak. Prints "leak <trace>: ..." per leaking run, "missing ..."
// per run without a readable trace, and "runs <n>" / "tool_results <n>" totals. The caller treats a total
// of 0 runs or 0 tool results as "scanned nothing". `Darwin` is a leak except in a case whose scaffold
// is a macOS mode (the stand-in `uname` answers it there). The developer's own Cruma app is a leak in every
// case: a line of output that shows a `Cruma*.app` that exists (one that is not a "No such file or directory" answer)
// and a `"build_flavor":"gui"` version string (the stand-in `cruma` is a `server-agent`).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const listDirs = args[0] === "--dirs";
const resultFile = listDirs ? args[1] : args[0];
if (!resultFile) {
  console.error("usage: scan-eval-trace.mjs [--dirs] <result.json>");
  process.exit(2);
}

// The result is the harness's own report; only the fields read here are typed.
const result = JSON.parse(readFileSync(resultFile, "utf8"));
const root = result?.suite?.root ?? "";

function runsOf(result) {
  const runs = [];
  for (const testCase of result?.cases ?? []) {
    for (const [arm, armRuns] of Object.entries(testCase?.arms ?? {})) {
      for (const [index, run] of (armRuns ?? []).entries()) runs.push({ label: `${testCase.name} ${arm}#${index + 1}`, dir: testCase.dir, tracePath: run?.tracePath });
    }
  }
  return runs;
}

const runs = runsOf(result);
if (listDirs) {
  for (const run of runs) if (run.tracePath) console.log(dirname(dirname(run.tracePath)));
  process.exit(0);
}

function scaffoldMode(caseDir) {
  const file = join(resolve(root, caseDir ?? ""), "scaffold.sh");
  if (!existsSync(file)) return "";
  return /directory-shims\.sh"?\s+(\S+)/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
}

// The eval sandbox refusing or failing to start a command: not the skill's doing, so the run does not count.
const SANDBOX_FAILURE = "Operation not permitted|Read-only file system|apply-seccomp|bwrap: |nested userns|sandbox-exec: ";

// A line naming the host's app is the leak, unless it is the answer that the app is not there.
const HOST_APP = /\/Applications\/Cruma[^/\n]*\.app/;
const APP_ABSENT = /No such file or directory|cannot access|not found|Unable to find|does not exist/i;
const HOST_APP_LEAK = "/Applications/Cruma.app";
const GUI_BUILD = /"build_flavor"\s*:\s*"gui"/g;
const GUI_BUILD_LEAK = '"build_flavor":"gui"';

let bad = false;
let results = 0;
for (const run of runs) {
  if (!run.tracePath || !existsSync(run.tracePath)) {
    bad = true;
    console.log(`missing ${run.label}: no readable trace${run.tracePath ? ` at ${run.tracePath}` : ""}`);
    continue;
  }
  const leak = scaffoldMode(run.dir).startsWith("macos") ? new RegExp(`${SANDBOX_FAILURE}|/opt/homebrew`, "g") : new RegExp(`${SANDBOX_FAILURE}|/opt/homebrew|Darwin`, "g");
  const counts = new Map();
  for (const line of readFileSync(run.tracePath, "utf8").split("\n")) {
    let record;
    try { record = JSON.parse(line); } catch { continue; }
    const content = record?.message?.content;
    if (record?.type !== "user" || !Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type !== "tool_result") continue;
      results += 1;
      const text = typeof block.content === "string"
        ? block.content
        : Array.isArray(block.content) ? block.content.map((part) => part?.text ?? "").join("\n") : "";
      for (const hit of text.match(leak) ?? []) counts.set(hit, (counts.get(hit) ?? 0) + 1);
      for (const line of text.split("\n")) {
        if (HOST_APP.test(line) && !APP_ABSENT.test(line)) counts.set(HOST_APP_LEAK, (counts.get(HOST_APP_LEAK) ?? 0) + 1);
      }
      const guiBuilds = text.match(GUI_BUILD)?.length ?? 0;
      if (guiBuilds > 0) counts.set(GUI_BUILD_LEAK, (counts.get(GUI_BUILD_LEAK) ?? 0) + guiBuilds);
    }
  }
  if (counts.size > 0) {
    bad = true;
    console.log(`leak ${run.label} (${run.tracePath}): ${[...counts].map(([k, n]) => `${n} x ${k}`).join(", ")}`);
  }
}
console.log(`runs ${runs.length}`);
console.log(`tool_results ${results}`);
process.exit(bad ? 1 : 0);
