#!/usr/bin/env bash
# Stand-in npm, claude and cruma (installed) for this case; see fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" installed
