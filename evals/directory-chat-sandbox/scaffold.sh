#!/usr/bin/env bash
# Stand-in npm, curl, claude and cruma (missing) in a shell that is not the user's machine, like a
# hosted chat's code-execution container: nothing answers on localhost:3000 and `npm install`
# fails with no network. See fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" sandbox
