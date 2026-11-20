// Which plugin an evals/ case belongs to; scripts/stage-evals.mjs and scripts/codex-eval.mjs share it.
export const PLUGINS = ["cruma", "cruma-local", "cruma-cloud"];

const cloudPrefixes = ["board-", "cloud-", "memory-", "settings-"];
const directoryPrefix = "directory-";

export const owner = (name) => (name === "mocks" ? "cruma-local" : cloudPrefixes.some((prefix) => name.startsWith(prefix)) ? "cruma-cloud" : name.startsWith(directoryPrefix) ? "cruma" : "cruma-local");
