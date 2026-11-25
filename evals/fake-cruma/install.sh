#!/usr/bin/env bash
# Eval scaffold helper (cases run it from their scaffold.sh, so they need `--scaffold`).
# Puts a stand-in `cruma` at ~/.local/bin/cruma in the run's own HOME, where the plugin's
# SessionStart hook finds it like any install. It reports version 99.0.0, so it wins over a
# real agent on the machine, and its `agent-context` prints the file given as $1, or nothing.
set -euo pipefail
note="$HOME/.local/share/fake-cruma/session-note.txt"
mkdir -p "$HOME/.local/bin" "$(dirname "$note")"
if [ -n "${1:-}" ]; then cp "$1" "$note"; else : >"$note"; fi
cat >"$HOME/.local/bin/cruma" <<STUB
#!/bin/sh
case "\$1" in
  --version) echo "cruma 99.0.0" ;;
  agent-context) cat "$note" ;;
  *) echo "cruma (eval stand-in): only --version and agent-context" >&2; exit 2 ;;
esac
STUB
chmod +x "$HOME/.local/bin/cruma"
