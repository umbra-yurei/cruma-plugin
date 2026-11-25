// The environment `cruma mcp` runs with: exact names only, copied from the launcher's own
// environment when set. Nothing is matched by prefix and nothing else is passed on.

// Names `cruma mcp` and the agent it starts read (found in cruma-sdk).
const COMMON = [
  "PATH", // find helper programs and the installed agent
  "HOME", // profiles, config and the agent's data directory
  "USER", // current user name
  "LOGNAME", // current user name, fallback for USER
  "SHELL", // shell used to run hosted processes
  "TMPDIR", // temporary files; also the MCP local-socket directory on macOS
  "LANG", // text encoding
  "LC_ALL", // text encoding
  "XDG_RUNTIME_DIR", // MCP local-socket directory on Linux
  "XDG_CONFIG_HOME", // config directory
  "XDG_DATA_HOME", // data directory
  "XDG_CACHE_HOME", // cache directory
  "XDG_DATA_DIRS", // desktop entries and icons
  "XDG_SESSION_TYPE", // tells X11 from Wayland sessions
  "DISPLAY", // a desktop session exists (notifications)
  "WAYLAND_DISPLAY", // a desktop session exists (notifications)
  "SSH_CONNECTION", // inside SSH: no desktop or browser on this machine
  "SSH_TTY", // inside SSH: no desktop or browser on this machine
  "HOMEBREW_PREFIX", // finds a Homebrew install for update hints
  "RUST_LOG", // the agent's log level
  "CRUMA_NO_TELEMETRY", // the user's install-telemetry opt-out
  "HTTP_PROXY", // reach cruma.io from behind a proxy
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
  "SSL_CERT_FILE", // a corporate CA bundle
  "SSL_CERT_DIR",
];

const WINDOWS = [
  "USERPROFILE", // home directory
  "LOCALAPPDATA", // profile data and the local-socket directory
  "APPDATA", // roaming profile data
  "SystemRoot", // required by Windows networking
  "PATHEXT", // find .exe and .cmd programs
  "TEMP", // temporary files
  "TMP", // temporary files
  "SESSIONNAME", // tells a desktop session from a service
  "PROGRAMDATA", // machine-wide agent data
  "ProgramW6432", // Program Files
];

export const FORWARDED_NAMES = Object.freeze([...COMMON, ...WINDOWS]);

// An npm-installed `cruma` is a launcher that looks for an installed agent itself;
// this variable makes it run its own agent instead of looking again.
export const LAUNCHER_FLAG = "CRUMA_NPM_LAUNCHER";

export function buildEnvironment(source) {
  const environment = {};
  for (const name of FORWARDED_NAMES) {
    if (source[name] !== undefined) environment[name] = source[name];
  }
  environment[LAUNCHER_FLAG] = "1";
  return environment;
}
