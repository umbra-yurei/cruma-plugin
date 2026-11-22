#!/usr/bin/env bash
# Eval scaffold helper for the `directory-*` cases (they need `--scaffold` and `--allow-tools Bash`).
# Puts stand-ins for `npm`, `node`, `uname`, `curl`, `claude` and `cruma` in ~/.local/bin of the run's
# own HOME, so an install, an MCP server add (`claude mcp add`) or a share the skill runs touches nothing real. Each
# stand-in appends the command line it was given to ~/.local/share/directory-shims/calls.log.
# The agent's Bash PATH is then only that directory plus /usr/bin:/bin, so the host's Homebrew,
# /usr/local and real `cruma` are not on it, and `uname` answers Linux x86_64 like the prompts say.
# PATH is set in the eval workspace's .claude/settings.json and in the run home's shell start-up
# files (`claude plugin eval` takes it from either, depending on the version). The stand-ins are in
# the run's home because the eval sandbox allows reading it, and blocks the repository's .eval-work. The scaffold exits 3 when a zsh or bash login shell with only the run's
# HOME resolves a stand-in anywhere else; whether the sandbox runs them shows only in the run's
# trace, which scripts/eval-directory.sh scans.
#   $1 = missing    `cruma` says "command not found" until `npm install -g cruma` runs
#   $1 = installed  `cruma` answers as the agent version in cli/version.txt
#   $1 = sandbox    like `missing`, in an environment that does not allow installing, like a hosted chat's
#                   code-execution container: nothing answers on localhost (the user's dev
#                   server is elsewhere) and `npm install` fails with no network
#   $1 = macos      like `missing` on an Apple Silicon Mac (`uname` answers Darwin arm64) that has Node and npm
#                   but no Homebrew
#   $1 = macos-bare like `macos` with neither Node nor npm (no `node` or `npm` on PATH at all)
#   $1 = windows    like `missing` on a Windows 11 PC's Git Bash (`uname` answers MINGW64_NT) that has Node and
#                   npm but no winget
# In every mode but `sandbox`, `curl` to localhost/127.0.0.1 answers like the user's dev server.
# `npm install -g cruma` writes nothing under the run's home (the Linux eval sandbox mounts it read-only):
# it drops a per-run marker in the first writable of $TMPDIR, /tmp/claude, /tmp and the working directory,
# and the stand-in `cruma` (always in ~/.local/bin) answers "command not found" until that marker exists.
# The stand-ins log best-effort: the eval sandbox may refuse the write, and a stand-in (the long-running
# `cruma proxy` above all) must keep working then.
set -euo pipefail
mode="${1:?usage: directory-shims.sh missing|installed|sandbox|macos|macos-bare|windows}"
case "$mode" in
  missing|installed|sandbox)
    os=Linux arch=x86_64 release=6.8.0-eval
    uname_a="Linux eval-host 6.8.0-eval #1 SMP x86_64 GNU/Linux" ;;
  macos|macos-bare)
    os=Darwin arch=arm64 release=23.6.0
    uname_a="Darwin eval-host 23.6.0 Eval Release 23.6.0 RELEASE_ARM64 arm64" ;;
  windows)
    os=MINGW64_NT-10.0-22631 arch=x86_64 release=3.5.4
    uname_a="MINGW64_NT-10.0-22631 eval-host 3.5.4 2024-08-25 x86_64 Msys" ;;
  *) echo "directory-shims: unknown mode '$mode'; usage: directory-shims.sh missing|installed|sandbox|macos|macos-bare|windows" >&2; exit 2 ;;
esac
bin="$HOME/.local/bin"
log="$HOME/.local/share/directory-shims/calls.log"
mkdir -p "$bin" "$(dirname "$log")"
: >"$log"

# Everything the stand-in `cruma` prints is a file the cruma-sdk plugin-mocks generator wrote
# from the real types and clap definitions (cli/); nothing is typed out here.
data="$(dirname "$log")/cli"
# Pasted at the top of every stand-in: a log write that fails (read-only path in the sandbox) is dropped,
# silently, and never changes what the stand-in does or returns.
logfn="log() { { echo \"\$*\" >>\"$log\"; } 2>/dev/null || true; }"
# Where `npm install -g cruma` records that it ran, and where the `cruma` stand-in looks for it.
id="$$-$RANDOM-$(date +%s)"
marker="cruma-eval-installed-$id"
markdirs='"${TMPDIR:-/tmp}" /tmp/claude /tmp "$PWD"'
mkdir -p "$data"
cp "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cli/"* "$data/"

cat >"$bin/cruma-installed" <<STUB
#!/bin/sh
$logfn
log "cruma \$*"
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
  exec sleep 2147483647
else
  echo "cruma (eval stand-in): unsupported: \$*" >&2
  exit 2
fi
STUB

cat >"$bin/npm" <<STUB
#!/bin/sh
$logfn
log "npm \$*"
if [ "$mode" = sandbox ] && [ "\$1" = install ]; then
  echo "npm error code EAI_AGAIN" >&2
  echo "npm error request to https://registry.npmjs.org/cruma failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org" >&2
  exit 1
elif [ "\$1 \$2 \$3" = "install -g cruma" ]; then
  ok=0
  for d in $markdirs; do
    if { : >"\$d/$marker"; } 2>/dev/null; then ok=1; break; fi
  done
  if [ "\$ok" != 1 ]; then
    echo "npm error code EACCES" >&2
    echo "npm error Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/cruma'" >&2
    exit 243
  fi
  echo "added 1 package in 2s"
else
  echo "npm (eval stand-in): unsupported: \$*" >&2; exit 2
fi
STUB

cat >"$bin/claude" <<STUB
#!/bin/sh
$logfn
log "claude \$*"
case "\$1 \$2" in
  "mcp list") echo "No MCP servers configured." ;;
  "mcp add") echo "Added stdio MCP server cruma to user config" ;;
  *) echo "claude (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
STUB

cat >"$bin/node" <<STUB
#!/bin/sh
$logfn
log "node \$*"
case "\$1" in
  --version|-v) echo v22.12.0 ;;
  *) echo "node (eval stand-in): unsupported: \$*" >&2; exit 2 ;;
esac
STUB

cat >"$bin/uname" <<STUB
#!/bin/sh
case "\$*" in
  -m) echo $arch ;;
  -a) echo "$uname_a" ;;
  -r) echo $release ;;
  -s) echo $os ;;
  "-s -m"|"-m -s"|-sm|-ms) echo "$os $arch" ;;
  *) echo $os ;;
esac
STUB

# Only a localhost probe (the skill's "is the dev server here?" check) is answered.
cat >"$bin/curl" <<STUB
#!/bin/sh
$logfn
log "curl \$*"
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
  cat >"$bin/cruma" <<STUB
#!/bin/sh
for d in $markdirs; do
  [ -e "\$d/$marker" ] && exec "$bin/cruma-installed" "\$@"
done
echo "cruma: command not found" >&2
exit 127
STUB
fi
# A Mac without Node has no npm or node on PATH at all, so `command -v npm` finds nothing.
tools="cruma cruma-installed npm node uname curl claude"
if [ "$mode" = macos-bare ]; then
  rm -f "$bin/npm" "$bin/node"
  tools="cruma cruma-installed uname curl claude"
fi
for tool in $tools; do chmod +x "$bin/$tool"; done

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
# agent's Bash will (a login shell with only the run's HOME) and require it to come from $bin
# (in macos-bare, `npm` and `node` must not resolve at all).
# This cannot see the eval sandbox: the harness's `Operation not permitted` on a stand-in only
# shows in a run's trace, which scripts/eval-directory.sh scans for.
for sh in zsh bash; do
  shell="$(command -v "$sh" 2>/dev/null)" || continue
  for tool in cruma npm node uname curl claude; do
    found="$(env -i HOME="$HOME" PATH=/usr/bin:/bin "$shell" -lic "command -v $tool" 2>/dev/null | tail -n 1 || true)"
    if [ "$mode" = macos-bare ] && { [ "$tool" = npm ] || [ "$tool" = node ]; }; then
      if [ -n "$found" ]; then
        echo "directory-shims: $tool resolves to '$found' in a $sh login shell, but macos-bare has neither Node nor npm; refusing to run an unisolated eval" >&2
        exit 3
      fi
    elif [ "$found" != "$bin/$tool" ]; then
      echo "directory-shims: $tool resolves to '${found:-nothing}' in a $sh login shell, not to $bin/$tool; refusing to run an unisolated eval" >&2
      exit 3
    fi
  done
done
