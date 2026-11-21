#!/usr/bin/env node
// Scans `claude plugin eval` out/trace.jsonl files for the host leaking into the agent's Bash.
//   node scripts/scan-eval-trace.mjs <trace.jsonl>...
// Only tool results count (what the agent's commands printed), never the model's own words or the
// harness's session records. Prints one line per leaking trace and "tool_results <n>" for the total;
// exits 1 on a leak. The caller treats a total of 0 as "scanned nothing".
import { readFileSync } from "node:fs";

const LEAK = /Operation not permitted|\/opt\/homebrew|Darwin/g;
let leaked = false;
let results = 0;
for (const file of process.argv.slice(2)) {
  const counts = new Map();
  for (const line of readFileSync(file, "utf8").split("\n")) {
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
      for (const hit of text.match(LEAK) ?? []) counts.set(hit, (counts.get(hit) ?? 0) + 1);
    }
  }
  if (counts.size > 0) {
    leaked = true;
    console.log(`leak ${file}: ${[...counts].map(([k, n]) => `${n} x ${k}`).join(", ")}`);
  }
}
console.log(`tool_results ${results}`);
process.exit(leaked ? 1 : 0);
