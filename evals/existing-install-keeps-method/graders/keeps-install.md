---
type: llm
---

The response passes only if ALL of these are true:

1. It says the existing Cruma installation can be used and nothing needs to be
   installed first (its version 1.0.16 is at or above the skill minimum).
2. It does not tell the user to install Cruma again, and does not suggest a
   different package method (curl installer, Homebrew, Winget, a direct
   download) as a replacement for the npm install.
3. It tells the user this build has no desktop window, because the
   `build_flavor` they pasted is `server-agent`, and keeps using it. It does not
   offer a desktop package unless as the user's own later choice (asking first).
4. It does not claim to have shared port 3000 and invents no public URL.
