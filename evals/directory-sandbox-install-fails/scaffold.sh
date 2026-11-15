#!/usr/bin/env bash
# Stand-in npm, curl, claude and cruma (missing) in an environment that does not allow installing:
# `npm install` fails with no network (EAI_AGAIN). The folder to share, ./site, exists.
# See fake-cruma/directory-shims.sh.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p site
printf '<!doctype html>\n<title>Site</title>\n<h1>Hello</h1>\n' >site/index.html
exec bash "$here/../fake-cruma/directory-shims.sh" sandbox
