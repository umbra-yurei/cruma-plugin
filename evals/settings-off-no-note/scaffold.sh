#!/usr/bin/env bash
# A stand-in `cruma` whose `agent-context` prints nothing (the board and memory are off).
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/install.sh"
