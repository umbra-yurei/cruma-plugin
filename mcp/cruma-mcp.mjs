// Starts `cruma mcp` from the Cruma agent already installed on this machine.
// It downloads nothing: when no agent is found it prints how to install one and exits.
import { spawn, spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { buildEnvironment } from "./environment.mjs";

const home = homedir();
const candidates = [
  "/Applications/Cruma.app/Contents/MacOS/cruma",
  join(home, "Applications", "Cruma.app", "Contents", "MacOS", "cruma"),
  "/opt/homebrew/bin/cruma",
  "/usr/local/bin/cruma",
  "/home/linuxbrew/.linuxbrew/bin/cruma",
  join(home, ".local", "bin", "cruma"),
  join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WindowsApps", "cruma.exe"),
  "cruma", // whatever is first on PATH
];

const environment = buildEnvironment(process.env);

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

function isNewer(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

// The first working install wins; a later one replaces it only when strictly newer.
let chosen;
for (const executable of candidates) {
  const version = versionOf(executable);
  if (version && (!chosen || isNewer(version, chosen.version))) chosen = { executable, version };
}

if (!chosen) {
  console.error(
    "cruma: the Cruma agent (1.0.12 or newer) was not found. Ask the cruma:agent skill to install it, or see https://cruma.io/book/cruma-tunnels/coding-agents.md, then restart Claude Code.",
  );
  process.exit(1);
}

const child = spawn(chosen.executable, ["mcp"], { env: environment, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(`cruma: unable to start ${chosen.executable}: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
