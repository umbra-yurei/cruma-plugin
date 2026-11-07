#!/usr/bin/env bash
# Runs the skill-only `cruma` plugin's directory-* eval cases in an isolated environment.
#   scripts/eval-directory.sh [--check-only] [claude plugin eval options...]
# `claude plugin eval` gives the agent the PATH of the shell that started it, so this puts the
# stand-ins (evals/fake-cruma/bin) first on that PATH, checks them without a model call, and
# starts the suite with `--scaffold --allow-tools Bash --case 'directory-*'`. Extra options are
# passed on (--keep-temp, --runs 1, --case <glob>, ...). --check-only stops after the check.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
claude_bin="$(command -v claude)" || { echo "claude is not on PATH" >&2; exit 2; }
check_only=0
if [ "${1:-}" = --check-only ]; then check_only=1; shift; fi

shims="$root/.eval-work/shims"
rm -rf "$shims"
mkdir -p "$shims/bin"
cp -p "$root/evals/fake-cruma/bin/"* "$root/evals/fake-cruma/bin/.cruma-eval-shims" "$shims/bin/"
chmod +x "$shims/bin/"*
ln -s printenv "$shims/bin/env"
isolated="$shims/bin:/usr/bin:/bin"

# Check the stand-ins in a throwaway home, with the PATH the agent will get.
home="$(mktemp -d)"
trap 'rm -rf "$home"' EXIT
iso() { env -i HOME="$home" PATH="$isolated" CLAUDECODE=1 /bin/sh -c 'exec "$@"' sh "$@"; }
fail() { echo "eval-directory: check failed: $*" >&2; exit 1; }
scaffold="$root/evals/fake-cruma/directory-shims.sh"
cli="$root/evals/fake-cruma/cli"

[ "$(iso uname -sm)" = "Linux x86_64" ] || fail "uname does not answer Linux x86_64"
[ "$(iso uname -s)" = Linux ] || fail "uname -s does not answer Linux"
iso bash "$scaffold" missing || fail "scaffold (missing) refused the isolated PATH"
iso cruma --version >/dev/null 2>&1 && fail "cruma answers before npm install -g cruma"
iso npm install -g cruma >/dev/null || fail "npm install -g cruma"
[ "$(iso cruma --version)" = "$(cat "$cli/version.txt")" ] || fail "cruma --version differs from cli/version.txt"
[ "$(iso printenv CLAUDECODE)" = 1 ] || fail "printenv hides CLAUDECODE outside the sandbox case"
iso bash "$scaffold" sandbox || fail "scaffold (sandbox)"
[ -z "$(iso printenv CLAUDECODE || true)" ] || fail "printenv shows CLAUDECODE in the sandbox case"
[ -z "$(iso env | grep '^CLAUDECODE=' || true)" ] || fail "env shows CLAUDECODE in the sandbox case"
iso bash "$scaffold" installed || fail "scaffold (installed)"
iso cruma proxy http 3000 --json >"$home/ready.out" 2>&1 &
proxy=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$home/ready.out" ] && break; sleep 0.3; done
kill "$proxy" 2>/dev/null || true
cmp -s "$home/ready.out" "$cli/ready.json" || fail "cruma proxy did not print cli/ready.json without a network"
# The scaffold must refuse the host PATH.
if env -i HOME="$home" PATH="/usr/bin:/bin" bash "$scaffold" installed 2>/dev/null; then
  fail "scaffold accepted a PATH without the stand-ins"
fi
echo "eval-directory: stand-ins first on PATH ($shims/bin), check passed"
[ "$check_only" = 0 ] || exit 0

node "$root/scripts/stage-evals.mjs" cruma >/dev/null
cd "$root"
exec env PATH="$isolated" "$claude_bin" plugin eval .eval-work/cruma --trust-plugin --scaffold \
  --allow-tools Bash --case 'directory-*' "$@"
