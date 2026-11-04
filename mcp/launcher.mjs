// Finds the installed Cruma agent and starts `cruma mcp` with the allowlisted environment, or
// runs `cruma agent-context` for the SessionStart hook. It downloads nothing: when no agent is
// found, `cruma mcp` prints how to install one and exits, and the hook prints nothing.
import { homedir } from "node:os";
import { join } from "node:path";
import { buildEnvironment } from "./environment.mjs";

export function candidatePaths(source) {
  const home = homedir();
  return [
    "/Applications/Cruma.app/Contents/MacOS/cruma",
    join(home, "Applications", "Cruma.app", "Contents", "MacOS", "cruma"),
    "/opt/homebrew/bin/cruma",
    "/usr/local/bin/cruma",
    "/home/linuxbrew/.linuxbrew/bin/cruma",
    join(home, ".local", "bin", "cruma"),
    join(source.LOCALAPPDATA ?? "", "Microsoft", "WindowsApps", "cruma.exe"),
    "cruma", // whatever is first on PATH
  ];
}

function isNewer(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

// The installed agent to run, probing each candidate with `cruma --version` under
// `environment`: the first working install wins, and a later one replaces it only when
// strictly newer. `undefined` when none answers. `spawnSync` is node:child_process's;
// tests pass a recording stand-in.
export function findCruma({ environment, candidates, spawnSync }) {
  function versionOf(executable) {
    const probe = spawnSync(executable, ["--version"], {
      env: environment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    });
    const match = probe.status === 0 ? /(\d+)\.(\d+)\.(\d+)/.exec(probe.stdout) : null;
    return match ? match.slice(1).map(Number) : undefined;
  }

  let chosen;
  for (const executable of candidates) {
    const version = versionOf(executable);
    if (version && (!chosen || isNewer(version, chosen.version))) chosen = { executable, version };
  }
  return chosen?.executable;
}

// `spawnSync` and `spawn` are node:child_process's; tests pass recording stand-ins.
export function launch({ source, candidates, spawnSync, spawn, exit, onSignal, error }) {
  const environment = buildEnvironment(source);
  const executable = findCruma({ environment, candidates, spawnSync });

  if (!executable) {
    error(
      "cruma: the Cruma agent (1.0.12 or newer) was not found. Ask the cruma:agent skill to install it, or see https://cruma.io/book/cruma-tunnels/coding-agents.md, then restart Claude Code.",
    );
    exit(1);
    return;
  }

  const child = spawn(executable, ["mcp"], { env: environment, stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) onSignal(signal, () => child.kill(signal));
  child.on("error", (failure) => {
    error(`cruma: unable to start ${executable}: ${failure.message}`);
    exit(1);
  });
  child.on("exit", (code, signal) => {
    exit(code ?? (signal ? 1 : 0));
  });
}

// `cruma agent-context` limits each request to 2 s and falls back to its cache; this bounds
// the whole command, so a session start never waits longer.
export const AGENT_CONTEXT_TIMEOUT_MS = 8000;

// The account's session note from `cruma agent-context`, for the SessionStart hook: the
// same install `launch` would start, with the same environment. Empty when no agent is
// installed, the command fails or times out (an agent older than the subcommand exits
// non-zero), or the agent prints nothing (not signed in, or the board and memory are off).
export function sessionNote({ source, candidates, spawnSync }) {
  const environment = buildEnvironment(source);
  const executable = findCruma({ environment, candidates, spawnSync });
  if (!executable) return "";
  const result = spawnSync(executable, ["agent-context"], {
    env: environment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: AGENT_CONTEXT_TIMEOUT_MS,
  });
  return result.status === 0 && typeof result.stdout === "string" ? result.stdout.trim() : "";
}
