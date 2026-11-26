#!/usr/bin/env bash
# Runs the skill-only `cruma` plugin's directory-* eval cases and fails when the agent was not isolated.
#   scripts/eval-directory.sh [--check-only] [claude plugin eval options...]
# --check-only: runs the scaffold in throwaway homes (no model call) and checks the stand-ins it writes.
# Otherwise: starts one `claude plugin eval --scaffold --case <name> --json <file>` per directory-* case (`--case <glob>`
# picks them; default 'directory-*'), granting each case exactly the gated tools its prompt.md `allowed_tools` declares
# (`--allow-tools Bash` for `[Skill, Bash]`, no grant for `[Skill]`: scripts/eval-grants.mjs), with the other options
# (not --json, --allow-tools or --output-dir: the script owns them), keeps each run's temp directory, and takes the
# runs' traces from the result's own `tracePath` fields (never from the harness's log wording). It fails
# if no run, trace or tool result was scanned, or if a tool result in a run's trace shows the host
# leaking in or the sandbox failing (scripts/scan-eval-trace.mjs: `Operation not permitted`, `Read-only file system`,
# `apply-seccomp`, bwrap start-up errors, /opt/homebrew, Darwin outside the macOS cases, the host's Cruma.app,
# a `"build_flavor":"gui"` version, a Bash call in a case whose allowed_tools has no Bash). Every run is started with `--disallow-tools Agent Task`: a subagent has its own Bash outside the grants and the stand-ins. With --keep-temp the script's own temp directory, with each case's result JSON, is kept too and its path printed. The kept directories are removed afterwards unless --keep-temp was passed.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
scaffold="$root/evals/fake-cruma/directory-shims.sh"
cli="$root/evals/fake-cruma/cli"
fail() { echo "eval-directory: $*" >&2; exit 1; }

check_only=0
if [ "${1:-}" = --check-only ]; then check_only=1; shift; fi
tmp="$(mktemp -d)"
keep=0
trap '[ "$keep" = 1 ] || rm -rf "$tmp"' EXIT

# --case picks the cases; every other option goes to each harness run as it is.
case_glob='directory-*'
harness_args=()
while [ $# -gt 0 ]; do
  case "$1" in
    --case) [ $# -ge 2 ] || fail "--case needs a glob"; case_glob="$2"; shift 2; continue ;;
    --case=*) case_glob="${1#--case=}" ;;
    --keep-temp) keep=1; shift; continue ;;
    --output-dir|--output-dir=*) fail "the script owns --output-dir: every case is a separate run and its result file would overwrite the last" ;;
    --json|--json=*) fail "the script owns --json (it reads the runs' traces from it); the result files are kept with --keep-temp" ;;
    --allow-tools|--allow-tools=*) fail "the script owns --allow-tools: each case is granted exactly the gated tools its prompt.md allowed_tools declares" ;;
  esac
  case "$1" in --case=*) ;; *) harness_args+=("$1") ;; esac
  shift
done

# The scaffold refuses (exit 3) when a stand-in does not resolve first in a login shell of the run's home.
for mode in missing installed sandbox macos macos-bare windows; do
  mkdir -p "$tmp/home-$mode" "$tmp/ws-$mode"
  (cd "$tmp/ws-$mode" && env -i HOME="$tmp/home-$mode" PATH="$PATH" bash "$scaffold" "$mode") \
    || fail "scaffold ($mode) refused its isolation"
done
bin="$tmp/home-missing/.local/bin"
[ "$("$bin/uname" -sm)" = "Linux x86_64" ] || fail "uname -sm does not answer Linux x86_64"
"$bin/cruma" --version >/dev/null 2>&1 && fail "cruma answers before npm install -g cruma"
# `npm install -g cruma` must write nothing under the run's home or workspace (the Linux eval sandbox mounts the home
# read-only): only a marker in $TMPDIR. With the home made read-only too (not possible as root) it must still succeed.
mkdir "$tmp/tmpdir" "$tmp/tmpdir-other"
touch "$tmp/ref"; sleep 1
[ "$(id -u)" = 0 ] || chmod -R a-w "$tmp/home-missing" "$tmp/ws-missing"
(cd "$tmp/ws-missing" && TMPDIR="$tmp/tmpdir" "$bin/npm" install -g cruma >/dev/null) || fail "npm install -g cruma"
chmod -R u+w "$tmp/home-missing" "$tmp/ws-missing"
changed="$(find "$tmp/home-missing" "$tmp/ws-missing" -newer "$tmp/ref" ! -type d ! -name calls.log)"
[ -z "$changed" ] || fail "npm install -g cruma wrote into the run's home or workspace: $changed"
[ -n "$(ls "$tmp/tmpdir")" ] || fail "npm install -g cruma left no marker in \$TMPDIR"
[ "$(TMPDIR="$tmp/tmpdir" "$bin/cruma" --version)" = "$(cat "$cli/version.txt")" ] || fail "cruma --version differs from cli/version.txt after npm install -g cruma"
TMPDIR="$tmp/tmpdir-other" "$bin/cruma" --version >/dev/null 2>&1 && fail "cruma answers where npm install -g cruma left no marker"
"$tmp/home-sandbox/.local/bin/npm" install -g cruma >/dev/null 2>&1 && fail "npm install succeeds in the sandbox mode"
"$tmp/home-sandbox/.local/bin/curl" -s localhost:3000 >/dev/null 2>&1 && fail "curl reaches localhost in the sandbox mode"
# Every stand-in below runs with an unwritable log (the eval sandbox may refuse the write): `cruma proxy` must still print its ready line and stay up.
rm -rf "$tmp/home-installed/.local/share/directory-shims/calls.log"
mkdir "$tmp/home-installed/.local/share/directory-shims/calls.log"
"$tmp/home-installed/.local/bin/cruma" --version 2>"$tmp/version.err" | cmp -s - "$cli/version.txt" || fail "cruma --version fails when calls.log is not writable"
[ ! -s "$tmp/version.err" ] || fail "a stand-in prints an error when calls.log is not writable"
"$tmp/home-installed/.local/bin/cruma" proxy http 3000 --json >"$tmp/ready.out" 2>&1 &
proxy=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$tmp/ready.out" ] && break; sleep 0.3; done
alive=0; kill -0 "$proxy" 2>/dev/null && alive=1
kill "$proxy" 2>/dev/null || true
[ "$alive" = 1 ] || fail "cruma proxy exited after its ready line"
# The stand-in must stay up until the agent kills it: any finite sleep shorter than a day can end mid-case and read as a dead tunnel.
life="$(sed -n 's/^ *exec sleep \([0-9][0-9]*\)$/\1/p' "$tmp/home-installed/.local/bin/cruma")"
[ -n "$life" ] && [ "$life" -ge 86400 ] || fail "the cruma proxy stand-in sleeps ${life:-an unreadable time} seconds after its ready line; it must stay up until killed"
cmp -s "$tmp/ready.out" "$cli/ready.json" || fail "cruma proxy did not print cli/ready.json without a network"
[ "$("$tmp/home-macos/.local/bin/uname" -sm)" = "Darwin arm64" ] || fail "macos mode: uname -sm does not answer Darwin arm64"
TMPDIR="$tmp/tmpdir" "$tmp/home-macos/.local/bin/npm" install -g cruma >/dev/null || fail "macos mode: npm install -g cruma"
for tool in npm node; do
  [ ! -e "$tmp/home-macos-bare/.local/bin/$tool" ] || fail "macos-bare mode: a $tool stand-in exists, so command -v $tool finds it"
  env -i HOME="$tmp/home-macos-bare" PATH="$tmp/home-macos-bare/.local/bin" sh -c "command -v $tool" >/dev/null 2>&1 && fail "macos-bare mode: command -v $tool finds something"
done
case "$("$tmp/home-windows/.local/bin/uname" -sm)" in MINGW64_NT-*" x86_64") ;; *) fail "windows mode: uname -sm does not answer MINGW64_NT x86_64" ;; esac
TMPDIR="$tmp/tmpdir" "$tmp/home-windows/.local/bin/npm" install -g cruma >/dev/null || fail "windows mode: npm install -g cruma"
# The host's Cruma app is hidden: the existing-app check sees nothing, and a listing of the apps directory leaves it out.
mkdir -p "$tmp/host-apps/Cruma.app" "$tmp/host-apps/Other.app" "$tmp/home-host" "$tmp/ws-host"
(cd "$tmp/ws-host" && env -i HOME="$tmp/home-host" PATH="$PATH" DIRECTORY_SHIMS_HOST_APPS="$tmp/host-apps" bash "$scaffold" macos) || fail "scaffold (macos, host apps) refused its isolation"
hostbin="$tmp/home-host/.local/bin"
"$hostbin/ls" -d "$tmp/host-apps/Cruma.app" "$tmp/home-host/Applications/Cruma.app" >"$tmp/ls.out" 2>&1 && fail "ls finds the host's Cruma.app"
grep -q 'No such file or directory' "$tmp/ls.out" || fail "ls does not answer 'No such file or directory' for the host's Cruma.app"
"$hostbin/ls" "$tmp/host-apps" | grep -q Cruma && fail "ls lists the host's Cruma.app"
"$hostbin/ls" "$tmp/host-apps" | grep -q Other.app || fail "ls hides apps other than Cruma"
"$hostbin/open" -a Cruma >/dev/null 2>&1 && fail "open finds the host's Cruma.app"
grep -q "$tmp/host-apps/Cruma.app" "$tmp/ws-host/.claude/settings.json" || fail "the macOS workspace settings do not deny the sandbox reading the host's Cruma.app"
echo "eval-directory: stand-ins resolve first in a login shell of the run's home, check passed"
[ "$check_only" = 0 ] || exit 0

claude_bin="$(command -v claude)" || fail "claude is not on PATH"
node "$root/scripts/stage-evals.mjs" cruma >/dev/null
cd "$root"

# One harness run per case: `--allow-tools` is a grant for the whole run, so a case that declares only
# [Skill] can only run without Bash when it is not started with the Bash cases' grant.
cases="$(node "$root/scripts/eval-grants.mjs" --case "$case_glob")"
[ -n "$cases" ] || fail "no directory-* case matches --case '$case_glob'"
worst=0
problems=()
index=0
while IFS= read -r line; do
  IFS=$'\t' read -r -a fields <<<"$line"
  name="${fields[0]}"
  grant=()
  if [ "${#fields[@]}" -gt 1 ]; then grant=(--allow-tools "${fields[@]:1}"); fi
  index=$((index + 1))
  result="$tmp/result-$index.json"
  echo "eval-directory: $name (tools granted: ${fields[*]:1})" >&2
  set +e
  "$claude_bin" plugin eval .eval-work/cruma --trust-plugin --scaffold \
    --case "$name" --keep-temp --json "$result" --disallow-tools Agent Task ${grant[@]+"${grant[@]}"} ${harness_args[@]+"${harness_args[@]}"}
  status=$?
  set -e
  [ "$status" -le "$worst" ] || worst=$status
  echo "eval-directory: $name: harness exit $status, result file $result$([ "$keep" = 1 ] && echo ' (kept)')" >&2
  [ "$status" = 0 ] || problems+=("$name: the harness exited $status (scores in $result when --keep-temp)")

  if [ ! -s "$result" ]; then problems+=("$name: the run wrote no result at $result, so nothing was scanned; its scores do not count"); continue; fi
  scan_status=0
  scan_out="$(node "$root/scripts/scan-eval-trace.mjs" "$result")" || scan_status=$?
  echo "$scan_out" >&2

  # Remove each run's temp directory (named by its trace's path) unless --keep-temp; skip anything that is
  # not a run directory (a trace that is not <dir>/out/trace.jsonl, or a dir that holds the repo or home).
  if [ "$keep" = 0 ]; then
    while IFS= read -r dir; do
      [ -n "$dir" ] && [ -d "$dir/out" ] && [ -d "$dir/config" ] || continue
      case "$dir" in /|"$HOME"|"$root"|"$root"/*) continue ;; esac
      case "$root/" in "$dir"/*) continue ;; esac
      chmod -R u+rwx "$dir" 2>/dev/null || true
      rm -rf "$dir"
    done < <(node "$root/scripts/scan-eval-trace.mjs" --dirs "$result")
  fi

  case "$scan_out" in *"runs 0"*|"runs 0") problems+=("$name: the result lists no run with a trace, so nothing was scanned; its scores do not count") ;; esac
  [ "$scan_status" = 0 ] || problems+=("$name: a run leaked the host into the agent's Bash or has no readable trace (see above); its scores do not count")
  case "$scan_out" in *"tool_results 0") problems+=("$name: no tool results in any trace, so nothing was scanned; its scores do not count") ;; esac
done <<<"$cases"

if [ "${#problems[@]}" -gt 0 ]; then
  for problem in "${problems[@]}"; do echo "eval-directory: $problem" >&2; done
  exit 1
fi
exit "$worst"
