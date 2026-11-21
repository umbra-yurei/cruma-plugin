#!/usr/bin/env bash
# Eval scaffold helper for the `directory-*` cases (they need `--scaffold` and `--allow-tools Bash`).
# Puts stand-ins for `npm`, `node`, `uname`, `curl`, `claude` and `cruma` in ~/.local/bin of the run's
# own HOME, so an install, an MCP server add (`claude mcp add`) or a share the skill runs touches nothing real. Each
# stand-in appends the command line it was given to ~/.local/share/directory-shims/calls.log.
# It then writes the eval workspace's .claude/settings.json so the agent's PATH is only that
# directory plus /usr/bin:/bin: the host's Homebrew, /usr/local and real `cruma` are not on it,
# and `uname` answers Linux x86_64 like the prompts say. The agent runs Bash unsandboxed as the
# user, so without this it sees the host (a real `cruma`, real Homebrew, Darwin) instead.
#   $1 = missing    `cruma` says "command not found" until `npm install -g cruma` runs
#   $1 = installed  `cruma` answers as the agent version in cli/version.txt
#   $1 = sandbox    like `missing`, in an environment that does not allow installing, like a hosted chat's
#                   code-execution container: nothing answers on localhost (the user's dev
#                   server is elsewhere) and `npm install` fails with no network
# In `missing` and `installed`, `curl` to localhost/127.0.0.1 answers like the user's dev server.
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
if [ "$mode" = sandbox ] && [ "\$1" = install ]; then
  echo "npm error code EAI_AGAIN" >&2
  echo "npm error request to https://registry.npmjs.org/cruma failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org" >&2
  exit 1
elif [ "\$1 \$2 \$3" = "install -g cruma" ]; then
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
case "$*" in
  -m) echo x86_64 ;;
  -a) echo "Linux eval-host 6.8.0-eval #1 SMP x86_64 GNU/Linux" ;;
  -r) echo 6.8.0-eval ;;
  "-s -m"|"-m -s"|-sm|-ms) echo "Linux x86_64" ;;
  *) echo Linux ;;
esac
STUB

# Only a localhost probe (the skill's "is the dev server here?" check) is answered.
cat >"$bin/curl" <<STUB
#!/bin/sh
echo "curl \$*" >>"$log"
case " \$* " in
  *localhost*|*127.0.0.1*)
    port=\$(printf '%s\\n' "\$*" | sed -n 's/.*:\\([0-9][0-9]*\\).*/\\1/p')
    if [ "$mode" = sandbox ]; then
      echo "curl: (7) Failed to connect to localhost port \${port:-80} after 0 ms: Couldn't connect to server" >&2
      exit 7
    fi
    printf 'HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\n\\r\\n' ;;
  *)
    echo "curl (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
STUB

if [ "$mode" = installed ]; then
  cp "$bin/cruma-installed" "$bin/cruma"
else
  printf '#!/bin/sh\necho "cruma: command not found" >&2\nexit 127\n' >"$bin/cruma"
fi
chmod +x "$bin/cruma" "$bin/cruma-installed" "$bin/npm" "$bin/node" "$bin/uname" "$bin/curl" "$bin/claude"

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

# `claude plugin eval` takes the Bash tool's PATH from a snapshot of the login shell, or from the
# PATH it was started with, depending on the version. HOME is the run's own home here, so its shell
# start-up files set the PATH (never written over an existing file). zsh and bash on macOS run
# path_helper in /etc/zprofile and /etc/profile, which moves /usr/bin ahead of anything set in
# .zshenv, so the same line is also in the files read after it (.zprofile, .zshrc, .bash_profile).
for rc in .zshenv .zprofile .zshrc .bashrc .bash_profile .profile; do
  [ -e "$HOME/$rc" ] || printf 'export PATH="%s:/usr/bin:/bin"\n' "$bin" >"$HOME/$rc"
done

# Fail closed: an unisolated run is an error, never a score. Resolve every stand-in the way the
# agent's Bash will (a login shell with only the run's HOME) and require it to come from $bin.
# This cannot see the eval sandbox: the harness's `Operation not permitted` on a stand-in only
# shows in a run's trace, which scripts/eval-directory.sh scans for.
for sh in zsh bash; do
  shell="$(command -v "$sh" 2>/dev/null)" || continue
  for tool in cruma npm node uname curl claude; do
    found="$(env -i HOME="$HOME" PATH=/usr/bin:/bin "$shell" -lic "command -v $tool" 2>/dev/null | tail -n 1 || true)"
    if [ "$found" != "$bin/$tool" ]; then
      echo "directory-shims: $tool resolves to '${found:-nothing}' in a $sh login shell, not to $bin/$tool; refusing to run an unisolated eval" >&2
      exit 3
    fi
  done
done
