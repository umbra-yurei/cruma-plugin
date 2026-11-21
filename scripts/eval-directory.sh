#!/usr/bin/env bash
# Runs the skill-only `cruma` plugin's directory-* eval cases and fails when the agent was not isolated.
#   scripts/eval-directory.sh [--check-only] [claude plugin eval options...]
# --check-only: runs the scaffold in throwaway homes (no model call) and checks the stand-ins it writes.
# Otherwise: starts `claude plugin eval --scaffold --allow-tools Bash --case 'directory-*'` with the
# extra options, keeps each run's temp directory, and fails if its out/trace.jsonl shows the host leaking in
# (`Operation not permitted` on a stand-in, /opt/homebrew, Darwin). The kept directories are removed
# afterwards unless --keep-temp was passed.
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

leaks=0
while IFS= read -r dir; do
  case "$dir" in */claude-eval-*) ;; *) continue ;; esac
  [ -d "$dir" ] || continue
  while IFS= read -r -d '' trace; do
    if grep -qE 'Operation not permitted|/opt/homebrew|Darwin' "$trace"; then
      echo "eval-directory: host leaked into $trace:" >&2
      grep -oE 'Operation not permitted|/opt/homebrew|Darwin' "$trace" | sort | uniq -c >&2
      leaks=1
    fi
  done < <(find "$dir/out" -name trace.jsonl -print0 2>/dev/null)
  if [ "$keep" = 0 ]; then chmod -R u+rwx "$dir" 2>/dev/null || true; rm -rf "$dir"; fi
done < <(sed -n 's/^ *kept temp: //p' "$tmp/run.log")

[ "$leaks" = 0 ] || fail "the run was not isolated from the host; its scores do not count"
exit "$status"
