// Finds the installed Cruma agent and starts `cruma mcp` with the allowlisted environment.
// It downloads nothing: when no agent is found it prints how to install one and exits.
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

// `spawnSync` and `spawn` are node:child_process's; tests pass recording stand-ins.
export function launch({ source, candidates, spawnSync, spawn, exit, onSignal, error }) {
  const environment = buildEnvironment(source);

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

  // The first working install wins; a later one replaces it only when strictly newer.
  let chosen;
  for (const executable of candidates) {
    const version = versionOf(executable);
    if (version && (!chosen || isNewer(version, chosen.version))) chosen = { executable, version };
  }

  if (!chosen) {
    error(
      "cruma: the Cruma agent (1.0.12 or newer) was not found. Ask the cruma:agent skill to install it, or see https://cruma.io/book/cruma-tunnels/coding-agents.md, then restart Claude Code.",
    );
    exit(1);
    return;
  }

  const child = spawn(chosen.executable, ["mcp"], { env: environment, stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) onSignal(signal, () => child.kill(signal));
  child.on("error", (failure) => {
    error(`cruma: unable to start ${chosen.executable}: ${failure.message}`);
    exit(1);
  });
  child.on("exit", (code, signal) => {
    exit(code ?? (signal ? 1 : 0));
  });
}
