#!/usr/bin/env bash
# Stand-ins for a Windows 11 PC's Git Bash with Node and npm and no winget; see fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" windows
