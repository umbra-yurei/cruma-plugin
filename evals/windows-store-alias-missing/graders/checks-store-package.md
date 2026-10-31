---
type: llm
---

The assistant uses the shell to distinguish an installed Microsoft Store Cruma
package from a missing installation. It runs `cruma --version` (or equivalent
command lookup) and a PowerShell `Get-AppxPackage` check for Cruma. The scenario
is run on Windows with the Store package installed and the command alias absent.
