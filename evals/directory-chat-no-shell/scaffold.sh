#!/usr/bin/env bash
# Stand-ins for a hosted chat's code-execution container (no install, no localhost); see fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" sandbox
