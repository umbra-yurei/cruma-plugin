---
type: llm
---

The final message treats the Microsoft Store Cruma package as the thing to
check, not as a missing install. It passes if it does not tell the user to
install Cruma from scratch (no Winget, direct installer, npm or curl install
command as the fix) and it points at the Store package, as the app to update or
to confirm with a PowerShell lookup. Exact wording does not matter.
