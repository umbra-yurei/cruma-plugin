#!/usr/bin/env bash
# Runs the skill-only `cruma` plugin's directory-* eval cases and fails when the agent was not isolated.
#   scripts/eval-directory.sh [--check-only] [claude plugin eval options...]
# --check-only: runs the scaffold in throwaway homes (no model call) and checks the stand-ins it writes.
# Otherwise: starts `claude plugin eval --scaffold --allow-tools Bash --case 'directory-*'` with the
# extra options, keeps each run's temp directory, and fails if no directory or trace was scanned, or if a
# tool result in a run's out/trace.jsonl shows the host leaking in (scripts/scan-eval-trace.mjs:
# `Operation not permitted`, /opt/homebrew, Darwin). The kept directories are removed afterwards
# unless --keep-temp was passed.
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
for mode in missing installed sandbox; do
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
"$tmp/home-installed/.local/bin/cruma" proxy http 3000 --json >"$tmp/ready.out" 2>&1 &
proxy=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$tmp/ready.out" ] && break; sleep 0.3; done
kill "$proxy" 2>/dev/null || true
cmp -s "$tmp/ready.out" "$cli/ready.json" || fail "cruma proxy did not print cli/ready.json without a network"
echo "eval-directory: stand-ins resolve first in a login shell of the run's home, check passed"
[ "$check_only" = 0 ] || exit 0

claude_bin="$(command -v claude)" || fail "claude is not on PATH"
keep=0
for arg in "$@"; do [ "$arg" != --keep-temp ] || keep=1; done
node "$root/scripts/stage-evals.mjs" cruma >/dev/null
cd "$root"
set +e
"$claude_bin" plugin eval .eval-work/cruma --trust-plugin --scaffold --allow-tools Bash \
  --case 'directory-*' --keep-temp "$@" 2>&1 | tee "$tmp/run.log"
status=${PIPESTATUS[0]}
set -e

dirs=0
traces=()
while IFS= read -r dir; do
  case "$dir" in */claude-eval-*) ;; *) continue ;; esac
  [ -d "$dir" ] || continue
  dirs=$((dirs + 1))
  if [ -f "$dir/out/trace.jsonl" ]; then traces+=("$dir/out/trace.jsonl"); else echo "eval-directory: $dir has no out/trace.jsonl" >&2; fi
done < <(sed -n 's/^ *kept temp: //p' "$tmp/run.log")

scan_status=0
scan_out=""
if [ "${#traces[@]}" -gt 0 ]; then
  scan_out="$(node "$root/scripts/scan-eval-trace.mjs" "${traces[@]}")" || scan_status=$?
  [ -z "$scan_out" ] || echo "$scan_out" >&2
fi
if [ "$keep" = 0 ]; then
  while IFS= read -r dir; do
    case "$dir" in */claude-eval-*) chmod -R u+rwx "$dir" 2>/dev/null || true; rm -rf "$dir" ;; esac
  done < <(sed -n 's/^ *kept temp: //p' "$tmp/run.log")
fi

[ "$dirs" -gt 0 ] || fail "the run kept no temp directory, so nothing was scanned; its scores do not count"
[ "${#traces[@]}" -eq "$dirs" ] || fail "a kept temp directory has no out/trace.jsonl, so it was not scanned; its scores do not count"
[ "$scan_status" = 0 ] || fail "the host leaked into the agent's Bash (see above); its scores do not count"
case "$scan_out" in *"tool_results 0") fail "no tool results in any trace, so nothing was scanned; its scores do not count" ;; esac
exit "$status"
