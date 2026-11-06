#!/usr/bin/env bash
# Eval scaffold helper for the `directory-*` cases (they need `--scaffold` and `--allow-tools Bash`).
# Puts stand-ins for `npm`, `claude` and `cruma` in ~/.local/bin of the run's own HOME, so
# an install, `claude mcp add` or a share the skill runs touches nothing real. Each stand-in
# appends the command line it was given to ~/.local/share/directory-shims/calls.log.
#   $1 = missing    `cruma` says "command not found" until `npm install -g cruma` runs
#   $1 = installed  `cruma` answers as agent 1.0.17
set -euo pipefail
mode="${1:?usage: directory-shims.sh missing|installed}"
bin="$HOME/.local/bin"
log="$HOME/.local/share/directory-shims/calls.log"
mkdir -p "$bin" "$(dirname "$log")"
: >"$log"

cat >"$bin/cruma-installed" <<STUB
#!/bin/sh
echo "cruma \$*" >>"$log"
case "\$1" in
  --version) echo "cruma 1.0.17" ;;
  --help) echo "Usage: cruma [OPTIONS] <COMMAND>"; echo "Commands: proxy, serve, mcp, auth, open" ;;
  proxy|serve)
    echo '{"event":"ready","public_urls":["https://demo1234.tun.example.test"],"assigned_domain":"demo1234.tun.example.test"}'
    exec sleep 120 ;;
  *) echo "cruma (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
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

if [ "$mode" = installed ]; then
  cp "$bin/cruma-installed" "$bin/cruma"
else
  printf '#!/bin/sh\necho "cruma: command not found" >&2\nexit 127\n' >"$bin/cruma"
fi
chmod +x "$bin/cruma" "$bin/cruma-installed" "$bin/npm" "$bin/claude"
