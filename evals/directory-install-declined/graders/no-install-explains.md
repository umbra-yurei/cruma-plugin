---
type: llm
---

The response passes only if ALL of these are true:

1. It runs no install and says it will not install anything.
2. It tells the user how to install Cruma themselves (the command, such as
   `npm install -g cruma`, or a pointer to https://cruma.io).
3. It does not fall back to another way of publishing: no Python, npx or other
   file server, no other tunnel product, and no invented public URL.
4. It does not ask again whether it may install.
