import { homedir } from "node:os";
import { join } from "node:path";
import { buildEnvironment } from "./environment.mjs";

export function candidatePaths(localAppData) {
  const home = homedir();
  return [
    "/Applications/Cruma.app/Contents/MacOS/cruma",
    join(home, "Applications", "Cruma.app", "Contents", "MacOS", "cruma"),
    "/opt/homebrew/bin/cruma", "/usr/local/bin/cruma", "/home/linuxbrew/.linuxbrew/bin/cruma",
    join(home, ".local", "bin", "cruma"),
    join(localAppData ?? "", "Microsoft", "WindowsApps", "cruma.exe"), "cruma",
  ];
}

function versionOf(executable, environment, spawnSync) {
  const probe = spawnSync(executable, ["--version"], { env: environment, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2000 });
  const match = probe.status === 0 ? /(\d+)\.(\d+)\.(\d+)/.exec(probe.stdout) : null;
  return match?.slice(1).map(Number);
}

function newer(left, right) {
  return left.some((part, index) => part !== right[index] && left.slice(0, index).every((value, prior) => value === right[prior]) && part > right[index]);
}

export function findCruma({ environment, candidates, spawnSync }) {
  let chosen;
  for (const executable of candidates) {
    const version = versionOf(executable, environment, spawnSync);
    if (version && (!chosen || newer(version, chosen.version))) chosen = { executable, version };
  }
  return chosen?.executable;
}

export const AGENT_CONTEXT_TIMEOUT_MS = 8000;

export function sessionNote({ source, candidates, spawnSync }) {
  const environment = buildEnvironment(source);
  const executable = findCruma({ environment, candidates, spawnSync });
  if (!executable) return "";
  const result = spawnSync(executable, ["agent-context"], { env: environment, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: AGENT_CONTEXT_TIMEOUT_MS });
  return result.status === 0 && typeof result.stdout === "string" ? result.stdout.trim() : "";
}
