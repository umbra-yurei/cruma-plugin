#!/usr/bin/env bash
# A stand-in `cruma` whose `agent-context` prints nothing, so the session-start hook adds no
# note and the account's note (board and memory on) comes only from `session_context`.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/install.sh"
