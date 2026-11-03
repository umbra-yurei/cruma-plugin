// Fails when the installer bundled in the skill differs from cruma-cli's linux-install.sh.
// Compares against a cruma-cli checkout (CRUMA_CLI_DIR, or ../cruma-cli when present),
// otherwise against the published installer.
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLISHED = "https://files.cruma.io/files/tunnel-agent/install/linux-install.sh";
const HEADER = /^# (Bundled copy of cruma-cli|Do not edit here).*\n/gm;

const bundled = readFileSync(join(root, "skills/agent/scripts/linux-install.sh"), "utf8").replace(HEADER, "");

const checkout = join(process.env.CRUMA_CLI_DIR ?? join(root, "..", "cruma-cli"), "installers/linux-install.sh");
let original;
let origin;
if (existsSync(checkout)) {
  original = readFileSync(checkout, "utf8");
  origin = checkout;
} else {
  const response = await fetch(PUBLISHED);
  if (!response.ok) {
    console.error(`check-installer: ${PUBLISHED} answered ${response.status}`);
    process.exit(2);
  }
  original = await response.text();
  origin = PUBLISHED;
}

if (bundled !== original) {
  console.error(`check-installer: skills/agent/scripts/linux-install.sh differs from ${origin}. Copy the original over it and update the commit in its header.`);
  process.exit(1);
}
console.log(`check-installer: bundled installer matches ${origin}`);
