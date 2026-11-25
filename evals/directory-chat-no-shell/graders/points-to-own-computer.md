---
type: llm
---

The response passes only if ALL of these are true:

1. It says that sharing the dev server needs an agent running on the user's own
   computer (next to the dev server), and that this session (a chat whose shell, if
   any, is not the user's machine) cannot do it.
2. It points to a way to get there: an AI coding agent the user can run on their own
   computer (for example Claude Code, Codex or Cursor), the Claude Code install command
   or documentation link, or the plugin install commands
   (`claude plugin marketplace add umbra-yurei/cruma-plugin`, then
   `claude plugin install cruma@cruma-plugin`), or says the plugin is already synced into
   Claude Code when it was installed from claude.ai.
3. It did not install Cruma, did not run `cruma` and did not start a tunnel here, and it
   does not offer to ("shall I run it?") in this session.
4. It gives no public URL and invents none.
