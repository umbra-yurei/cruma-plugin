// The eval vocabulary scripts/stage-evals.mjs, check-codex.mjs and the Codex runner share: where
// things live, which plugin a case belongs to, and the tool and mock names the cases use.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const EVAL_WORK = join(root, ".eval-work");
export const MARKETPLACE_FILE = join(root, ".claude-plugin/marketplace.json");

export const DIRECTORY_PLUGIN = "cruma";
export const LOCAL_PLUGIN = "cruma-local";
export const CLOUD_PLUGIN = "cruma-cloud";
export const PLUGINS = [DIRECTORY_PLUGIN, LOCAL_PLUGIN, CLOUD_PLUGIN];
// The MCP server cruma-local's mcp.json declares (and the user-added `cruma mcp` server).
export const LOCAL_SERVER = "cruma";
// The version the eval stand-in `cruma` reports, newer than any real agent.
export const STAND_IN_VERSION = "99.0.0";

// Tool names as the graders and prompt.md `allowed_tools` write them (Claude's names).
export const BASH_TOOL = "Bash";
export const SKILL_TOOL = "Skill";
export const MCP_TOOL_PREFIX = "mcp__";
export const mcpToolName = (plugin, server, tool = "") => `${MCP_TOOL_PREFIX}plugin_${plugin}_${server}__${tool}`;
// A case's mock directory for one plugin's MCP server: mocks/plugin_<plugin>_<server>/.
export const mockDirName = (plugin, server) => `plugin_${plugin}_${server}`;
export const LOCAL_MOCK_DIR = mockDirName(LOCAL_PLUGIN, LOCAL_SERVER);
// Where scripts/stage-evals.mjs stages one plugin and its cases.
export const stagedPluginDir = (plugin) => join(EVAL_WORK, plugin);

const cloudPrefixes = ["board-", "cloud-", "memory-", "settings-"];
const directoryPrefix = "directory-";
const suiteMocks = "mocks";

export const owner = (name) => (name === suiteMocks ? LOCAL_PLUGIN : cloudPrefixes.some((prefix) => name.startsWith(prefix)) ? CLOUD_PLUGIN : name.startsWith(directoryPrefix) ? DIRECTORY_PLUGIN : LOCAL_PLUGIN);
