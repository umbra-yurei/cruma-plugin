#!/usr/bin/env bash
# Stand-ins for a machine with the agent installed; the cruma MCP tools come from mocks/; see fake-cruma/directory-shims.sh.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$here/../fake-cruma/directory-shims.sh" installed
