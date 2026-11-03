---
type: llm
---

The response passes only if ALL of these are true:

1. It says the existing Cruma installation can be used and nothing needs to be
   installed first (its version 1.0.16 is at or above the skill minimum).
2. It does not tell the user to install Cruma again, and does not suggest a
   different package method (curl installer, Homebrew, Winget, a direct
   download) as a replacement for the npm install.
3. If it mentions the build flavour, it reports that this build is a
   `server-agent` build without a desktop window, taken from the `build_flavor`
   field the user pasted, and only offers a desktop package as the user's own
   choice to make (asking first, and naming that the older `cruma` must be
   removed so it does not stay first on `PATH`).
4. It does not claim to have shared port 3000 and invents no public URL.
