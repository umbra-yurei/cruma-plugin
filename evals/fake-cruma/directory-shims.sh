#!/usr/bin/env bash
# Eval scaffold helper for the `directory-*` cases (they need `--scaffold` and `--allow-tools Bash`).
# Puts stand-ins for `npm`, `node`, `uname`, `claude` and `cruma` in ~/.local/bin of the run's
# own HOME, so an install, `claude mcp add` or a share the skill runs touches nothing real. Each
# stand-in appends the command line it was given to ~/.local/share/directory-shims/calls.log.
# It then writes the eval workspace's .claude/settings.json so the agent's PATH is only that
# directory plus /usr/bin:/bin: the host's Homebrew, /usr/local and real `cruma` are not on it,
# and `uname` answers Linux x86_64 like the prompts say. The agent runs Bash unsandboxed as the
# user, so without this it sees the host (a real `cruma`, real Homebrew, Darwin) instead.
#   $1 = missing    `cruma` says "command not found" until `npm install -g cruma` runs
#   $1 = installed  `cruma` answers as the agent version in cli/version.txt
#   $1 = sandbox    like `missing`, and `printenv`/`env` report no CLAUDECODE, like a shell in
#                   claude.ai chat's code-execution container (Claude Code sets CLAUDECODE=1
#                   in every shell it starts; a real run here has it, so it is hidden)
set -euo pipefail
mode="${1:?usage: directory-shims.sh missing|installed|sandbox}"
bin="$HOME/.local/bin"
log="$HOME/.local/share/directory-shims/calls.log"
mkdir -p "$bin" "$(dirname "$log")"
: >"$log"

# Everything the stand-in `cruma` prints is a file the cruma-sdk plugin-mocks generator wrote
# from the real types and clap definitions (cli/); nothing is typed out here.
data="$(dirname "$log")/cli"
mkdir -p "$data"
cp "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cli/"* "$data/"

cat >"$bin/cruma-installed" <<STUB
#!/bin/sh
echo "cruma \$*" >>"$log"
args=" \$* "
has() { case "\$args" in *" \$1 "*) return 0 ;; *) return 1 ;; esac; }
if has --version; then
  if has --json; then cat "$data/version.json"; else cat "$data/version.txt"; fi
elif has --help || [ \$# -eq 0 ]; then
  case "\$1 \$2" in
    "proxy http") cat "$data/help-proxy-http.txt" ;;
    proxy*) cat "$data/help-proxy.txt" ;;
    serve*) cat "$data/help-serve.txt" ;;
    *) cat "$data/help.txt" ;;
  esac
elif [ "\$1" = proxy ] || [ "\$1" = serve ]; then
  cat "$data/ready.json"
  exec sleep 120
else
  echo "cruma (eval stand-in): unsupported: \$*" >&2
  exit 2
fi
STUB

cat >"$bin/npm" <<STUB
#!/bin/sh
echo "npm \$*" >>"$log"
if [ "\$1 \$2 \$3" = "install -g cruma" ]; then
  cp "$bin/cruma-installed" "$bin/cruma"
  echo "added 1 package in 2s"
else
  echo "npm (eval stand-in): unsupported: \$*" >&2; exit 2
fi
STUB

cat >"$bin/claude" <<STUB
#!/bin/sh
echo "claude \$*" >>"$log"
case "\$1 \$2" in
  "mcp list") echo "No MCP servers configured." ;;
  "mcp add") echo "Added stdio MCP server cruma to user config" ;;
  *) echo "claude (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
STUB

cat >"$bin/node" <<STUB
#!/bin/sh
echo "node \$*" >>"$log"
case "\$1" in
  --version|-v) echo v22.12.0 ;;
  *) echo "node (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
STUB

cat >"$bin/uname" <<'STUB'
#!/bin/sh
case "$1" in
  -m) echo x86_64 ;;
  -a) echo "Linux eval-host 6.8.0-eval #1 SMP x86_64 GNU/Linux" ;;
  -r) echo 6.8.0-eval ;;
  *) echo Linux ;;
esac
STUB

if [ "$mode" = sandbox ]; then
  for tool in printenv env; do
    cat >"$bin/$tool" <<STUB
#!/bin/sh
exec /usr/bin/env -u CLAUDECODE -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_ENTRYPOINT /usr/bin/$tool "\$@"
STUB
    chmod +x "$bin/$tool"
  done
fi

if [ "$mode" = installed ]; then
  cp "$bin/cruma-installed" "$bin/cruma"
else
  printf '#!/bin/sh\necho "cruma: command not found" >&2\nexit 127\n' >"$bin/cruma"
fi
chmod +x "$bin/cruma" "$bin/cruma-installed" "$bin/npm" "$bin/node" "$bin/uname" "$bin/claude"

# Never write into a plugin source tree or over an existing settings file.
if [ ! -e .claude-plugin ] && [ ! -e .claude/settings.json ]; then
  mkdir -p .claude
  cat >.claude/settings.json <<SETTINGS
{
  "env": {
    "PATH": "$bin:/usr/bin:/bin"
  }
}
SETTINGS
fi
