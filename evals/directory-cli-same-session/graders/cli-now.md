---
type: llm
---

The response passes only if ALL of these are true:

1. It tells the user that the Cruma tools load in a new Claude Code session,
   not this one.
2. For the request in this session it uses the command line: it runs, or says
   it will run, `cruma proxy http 3000 --json` as a background process, and
   it reports the public URL only from that command's ready line, never one
   it invented.
3. It does not start a Python, npx or other local file server and does not
   install anything.
4. It uses only flags that `cruma --help` documents. It does not make up a
   command to list or stop shares.
