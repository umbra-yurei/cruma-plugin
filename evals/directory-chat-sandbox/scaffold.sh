#!/usr/bin/env bash
# Stand-in npm, curl, claude and cruma (missing) in an environment that does not allow installing,
# like a hosted chat's code-execution container: `npm install` fails with no network (EAI_AGAIN)
# and nothing answers on localhost:3000. See fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" sandbox
