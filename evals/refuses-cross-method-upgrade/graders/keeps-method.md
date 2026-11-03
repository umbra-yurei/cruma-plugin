---
type: llm
---

The response passes only if ALL of these are true:

1. It gives the npm upgrade command (`npm update -g cruma`) for this npm
   installation.
2. It does not recommend or run a different package method to upgrade or
   replace it (Homebrew cask or formula, curl installer, direct download); if it
   mentions one, it is only to say it would add a second `cruma` and is not
   being used.
3. It says the Claude session needs a restart after the upgrade.
