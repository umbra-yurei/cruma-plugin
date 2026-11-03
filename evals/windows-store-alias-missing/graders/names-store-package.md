---
type: llm
---

The final message treats the Microsoft Store Cruma package as the thing to
check, not as a missing install. It passes if ALL of these facts are present.
Exact wording does not matter, and nothing else is required.

1. It takes the Store install as the starting point, or says it is not
   installed in the Store only after checking. It does not tell the user to
   install Cruma from scratch.
2. It names the Store package check (`Get-AppxPackage -Name 'Umbra-Yurei.Cruma'`
   or an equivalent PowerShell/Store lookup), either as something it ran or as
   something the user can run to confirm the package, or it says why it relies
   on the user's statement that the Store app is installed.
