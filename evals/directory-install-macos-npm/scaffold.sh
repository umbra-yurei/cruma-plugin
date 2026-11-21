#!/usr/bin/env bash
# Stand-ins for an Apple Silicon Mac with Node and npm and no Homebrew; see fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" macos
