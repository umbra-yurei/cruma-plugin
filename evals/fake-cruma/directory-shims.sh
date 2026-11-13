#!/usr/bin/env bash
# Eval scaffold helper for the `directory-*` cases (they need `--scaffold` and `--allow-tools Bash`).
# The stand-ins for `npm`, `node`, `uname`, `claude`, `cruma`, `printenv` and `env` are the static
# files in bin/. They must be first on the agent's PATH, and `claude plugin eval` gives the agent the
# PATH of the shell that started it (case.yaml can only set EVAL_* variables; a PATH in the workspace's
# .claude/settings.json is not applied), so scripts/eval-directory.sh starts the suite with that PATH.
# This scaffold fails the run when the PATH is not that one, so a run on a host with a real `cruma`,
# Homebrew or Darwin is an error and never a score.
# It then writes the run's state in $HOME/.local/share/directory-shims (the stand-ins read it):
# the mode, the generated `cruma` output (cli/) and calls.log, one line per stand-in call.
#   $1 = missing    `cruma` says "command not found" until `npm install -g cruma` runs
#   $1 = installed  `cruma` answers as the agent version in cli/version.txt
#   $1 = sandbox    like `missing`, and `printenv`/`env` report no CLAUDECODE, like a shell in
#                   claude.ai chat's code-execution container (Claude Code sets CLAUDECODE=1
#                   in every shell it starts; a real run here has it, so it is hidden)
set -euo pipefail
mode="${1:?usage: directory-shims.sh missing|installed|sandbox}"
case "$mode" in missing | installed | sandbox) ;; *) echo "directory-shims.sh: unknown mode $mode" >&2; exit 2 ;; esac

bin=""
for tool in cruma npm node uname claude printenv env; do
  found="$(command -v "$tool" 2>/dev/null || true)"
  dir="$(dirname "${found:-/nonexistent/$tool}")"
  [ -n "$bin" ] || bin="$dir"
  if [ "$dir" != "$bin" ] || [ ! -e "$bin/.cruma-eval-shims" ]; then
    echo "directory-* eval: \`$tool\` resolves to ${found:-nothing}, not the stand-in directory. The agent runs with the PATH of the shell that started \`claude plugin eval\`; start the suite with scripts/eval-directory.sh (see the README, Evals)." >&2
    exit 3
  fi
done

state="$HOME/.local/share/directory-shims"
mkdir -p "$state"
: >"$state/calls.log"
printf '%s\n' "$mode" >"$state/mode"
rm -f "$state/cruma-installed"
[ "$mode" != installed ] || : >"$state/cruma-installed"

# Everything the stand-in `cruma` prints is a file the cruma-sdk plugin-mocks generator wrote
# from the real types and clap definitions (cli/); nothing is typed out here.
rm -rf "$state/cli"
mkdir -p "$state/cli"
cp "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cli/"* "$state/cli/"
