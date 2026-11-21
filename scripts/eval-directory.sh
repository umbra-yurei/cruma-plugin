#!/usr/bin/env bash
# Runs the skill-only `cruma` plugin's directory-* eval cases and fails when the agent was not isolated.
#   scripts/eval-directory.sh [--check-only] [claude plugin eval options...]
# --check-only: runs the scaffold in throwaway homes (no model call) and checks the stand-ins it writes.
# Otherwise: starts `claude plugin eval --scaffold --allow-tools Bash --case 'directory-*' --json <file>`
# with the extra options (not --json: the script owns it), keeps each run's temp directory, and takes the
# runs' traces from the result's own `tracePath` fields (never from the harness's log wording). It fails
# if no run, trace or tool result was scanned, or if a tool result in a run's trace shows the host
# leaking in (scripts/scan-eval-trace.mjs: `Operation not permitted`, /opt/homebrew, Darwin outside
# the macOS cases). The kept directories are removed afterwards unless --keep-temp was passed.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
scaffold="$root/evals/fake-cruma/directory-shims.sh"
cli="$root/evals/fake-cruma/cli"
fail() { echo "eval-directory: $*" >&2; exit 1; }

check_only=0
if [ "${1:-}" = --check-only ]; then check_only=1; shift; fi
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# The scaffold refuses (exit 3) when a stand-in does not resolve first in a login shell of the run's home.
for mode in missing installed sandbox macos macos-bare windows; do
  mkdir -p "$tmp/home-$mode" "$tmp/ws-$mode"
  (cd "$tmp/ws-$mode" && env -i HOME="$tmp/home-$mode" PATH="$PATH" bash "$scaffold" "$mode") \
    || fail "scaffold ($mode) refused its isolation"
done
bin="$tmp/home-missing/.local/bin"
[ "$("$bin/uname" -sm)" = "Linux x86_64" ] || fail "uname -sm does not answer Linux x86_64"
"$bin/cruma" --version >/dev/null 2>&1 && fail "cruma answers before npm install -g cruma"
"$bin/npm" install -g cruma >/dev/null || fail "npm install -g cruma"
[ "$("$bin/cruma" --version)" = "$(cat "$cli/version.txt")" ] || fail "cruma --version differs from cli/version.txt"
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
"$tmp/home-macos/.local/bin/npm" install -g cruma >/dev/null || fail "macos mode: npm install -g cruma"
for tool in npm node; do
  "$tmp/home-macos-bare/.local/bin/$tool" --version >/dev/null 2>&1 && fail "macos-bare mode: $tool answers"
done
case "$("$tmp/home-windows/.local/bin/uname" -sm)" in MINGW64_NT-*" x86_64") ;; *) fail "windows mode: uname -sm does not answer MINGW64_NT x86_64" ;; esac
"$tmp/home-windows/.local/bin/npm" install -g cruma >/dev/null || fail "windows mode: npm install -g cruma"
echo "eval-directory: stand-ins resolve first in a login shell of the run's home, check passed"
[ "$check_only" = 0 ] || exit 0

claude_bin="$(command -v claude)" || fail "claude is not on PATH"
keep=0
for arg in "$@"; do
  case "$arg" in
    --keep-temp) keep=1 ;;
    --json|--json=*) fail "the script owns --json (it reads the runs' traces from it); use --output-dir for the harness's own result files" ;;
  esac
done
node "$root/scripts/stage-evals.mjs" cruma >/dev/null
cd "$root"
result="$tmp/result.json"
set +e
"$claude_bin" plugin eval .eval-work/cruma --trust-plugin --scaffold --allow-tools Bash \
  --case 'directory-*' --keep-temp --json "$result" "$@"
status=$?
set -e

[ -s "$result" ] || fail "the run wrote no result at $result, so nothing was scanned; its scores do not count"
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

case "$scan_out" in *"runs 0"*|"runs 0") fail "the result lists no run with a trace, so nothing was scanned; its scores do not count" ;; esac
[ "$scan_status" = 0 ] || fail "a run leaked the host into the agent's Bash or has no readable trace (see above); its scores do not count"
case "$scan_out" in *"tool_results 0") fail "no tool results in any trace, so nothing was scanned; its scores do not count" ;; esac
exit "$status"
