// Starts `cruma mcp` from the Cruma agent already installed on this machine (see launcher.mjs).
import { spawn, spawnSync } from "node:child_process";
import { candidatePaths, launch } from "./launcher.mjs";

launch({
  source: process.env,
  candidates: candidatePaths(process.env),
  spawnSync,
  spawn,
  exit: (code) => process.exit(code),
  onSignal: (signal, handler) => process.on(signal, handler),
  error: (message) => console.error(message),
});
