#!/usr/bin/env bash
# Stand-in curl, hdiutil, codesign (fails), spctl and uname for a Mac without Homebrew or npm; see fake-cruma/mac-dmg-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/mac-dmg-shims.sh"
