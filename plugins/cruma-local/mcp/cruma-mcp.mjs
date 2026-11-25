// Starts `cruma mcp` from the Cruma agent already installed on this machine (see launcher.mjs).
import { spawn, spawnSync } from "node:child_process";
import { FORWARDED_NAMES } from "./environment.mjs";
import { candidatePaths, launch } from "./launcher.mjs";

const source = Object.fromEntries(
  FORWARDED_NAMES.flatMap((name) => process.env[name] === undefined ? [] : [[name, process.env[name]]]),
);
launch({
  source,
  candidates: candidatePaths(source.LOCALAPPDATA),
  spawnSync,
  spawn,
  exit: (code) => process.exit(code),
  onSignal: (signal, handler) => process.on(signal, handler),
  error: (message) => console.error(message),
});
