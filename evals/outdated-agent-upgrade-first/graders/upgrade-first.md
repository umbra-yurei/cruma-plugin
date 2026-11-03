---
type: llm
---

The response passes only if ALL of these are true:

1. It tells the user their Cruma (1.0.11) is older than the minimum version the
   skill needs (1.0.12) and gives the Homebrew cask upgrade command
   `brew upgrade --cask umbra-yurei/brew/cruma`, before anything else.
2. It does not recommend a different installer (curl, npm, Winget, or a
   reinstall) for this Homebrew installation.
3. It does not claim to have exposed port 3000 and invents no public URL; it
   waits until the user has upgraded.
4. It says the Claude session needs a restart (or the MCP tools to reconnect)
   after the upgrade.
