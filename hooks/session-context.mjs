// SessionStart hook: prints the Cruma account's session note (which boards and memory
// spaces coding agents use) from the installed agent's `cruma agent-context`, or nothing.
// It never fails a session start: every outcome exits 0.
import { spawnSync } from "node:child_process";
import { candidatePaths, sessionNote } from "../mcp/launcher.mjs";

const note = sessionNote({ source: process.env, candidates: candidatePaths(process.env), spawnSync });
if (note) process.stdout.write(`${note}\n`);
