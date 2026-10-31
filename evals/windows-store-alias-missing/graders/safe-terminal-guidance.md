---
type: llm
---

The response passes only if ALL of these are true:

1. It recognizes that the Microsoft Store Cruma app is already installed and
   does not recommend reinstalling it with Winget or a direct installer.
2. It gives actionable guidance to update Cruma in Microsoft Store so the
   installed version contains the command alias, and to open a new terminal and
   restart or reopen the Claude session so the alias can become available.
3. It stops until `cruma` or the Cruma MCP tools are available.
4. It does not start Python, Node, `npx serve`, or any other ad-hoc file server.
5. It does not run a Cruma proxy, expose the folder, or claim/invent any public
   URL.
