#!/usr/bin/env bash
# Stand-in npm, claude and cruma (missing), and a `printenv`/`env` that report no CLAUDECODE:
# a Bash tool in claude.ai chat's code-execution container. See fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" sandbox
