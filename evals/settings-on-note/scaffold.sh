#!/usr/bin/env bash
# A stand-in `cruma` whose `agent-context` prints this case's session-note.txt.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/install.sh" "$here/session-note.txt"
