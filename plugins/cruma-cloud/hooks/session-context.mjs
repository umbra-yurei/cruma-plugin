// SessionStart hook: prints the Cruma account's session note (which boards and memory
// spaces coding agents use) from the installed agent's `cruma agent-context`, or nothing.
// It never fails a session start: every outcome exits 0.
import { spawnSync } from "node:child_process";
import { FORWARDED_NAMES } from "../mcp/environment.mjs";
import { candidatePaths, sessionNote } from "../mcp/launcher.mjs";

const source = Object.fromEntries(
  FORWARDED_NAMES.flatMap((name) => process.env[name] === undefined ? [] : [[name, process.env[name]]]),
);
const note = sessionNote({ source, candidates: candidatePaths(source.LOCALAPPDATA), spawnSync });
if (note) process.stdout.write(`${note}\n`);
