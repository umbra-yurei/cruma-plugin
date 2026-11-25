// SessionStart hook: prints the Cruma account's session note (which boards and memory
// spaces coding agents use) from the installed agent's `cruma agent-context`, or nothing.
// It never fails a session start: every outcome exits 0.
import { spawnSync } from "node:child_process";
import { FORWARDED_NAMES } from "../mcp/environment.mjs";
import { candidatePaths, sessionNote } from "../mcp/launcher.mjs";

// The same names `cruma mcp` gets, proxy and CA variables included: `agent-context` makes up
// to three HTTPS requests (issuer discovery, token refresh, the settings from web-api) on a
// default reqwest client, which reads HTTP(S)_PROXY/ALL_PROXY/NO_PROXY and the native roots
// (SSL_CERT_FILE/SSL_CERT_DIR); see cruma-sdk cruma-tunnel-agent-bin/src/agent_context_cmd.rs.
// Without them a user behind a proxy gets no note.

const source = Object.fromEntries(
  FORWARDED_NAMES.flatMap((name) => process.env[name] === undefined ? [] : [[name, process.env[name]]]),
);
const note = sessionNote({ source, candidates: candidatePaths(source.LOCALAPPDATA), spawnSync });
if (note) process.stdout.write(`${note}\n`);
