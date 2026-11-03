#!/usr/bin/env bash
# Bundled copy of cruma-cli installers/linux-install.sh at commit c05c8934d6dc9451842376833b466745056f0e7d.
# Do not edit here: scripts/check-installer.mjs fails when this differs from the original.
set -euo pipefail

BINARY_NAME="cruma"
CHANNEL="${CRUMA_CHANNEL:-stable}"
MANIFEST_URL="${CRUMA_MANIFEST_URL:-https://files.cruma.io/files/tunnel-agent/${CHANNEL}.json}"
DEFAULT_BIN_DIR="$HOME/.local/bin"
INSTALL_DIR_OVERRIDE="${CRUMA_INSTALL_DIR:-}"

usage() {
  cat <<EOF
Usage: $0 [--uninstall]

Installs cruma into a user-local bin directory (default: \$HOME/.local/bin).
Set CRUMA_INSTALL_DIR to override the install location.
Use --uninstall to remove previously installed copies from user-local bin directories.
EOF
}

ACTION="install"
case "${1:-}" in
  "" ) ;;
  --uninstall|-u) ACTION="uninstall" ;;
  --help|-h) usage; exit 0 ;;
  *) usage; exit 1 ;;
esac

resolve_linux_gnu_artifact() {
  local architecture="$1"
  local json="$2"
  local artifact_key="linux_gnu_${architecture}"

  # Channel manifests are generated from the typed LinuxGnuArtifact schema in
  # cruma-cli. Accept only its URL + SHA-256 pair for the selected architecture.
  # This deliberately rejects partial or ambiguous manifest entries.
  awk -v key="$artifact_key" '
    $0 ~ "^[[:space:]]*\"" key "\"[[:space:]]*:[[:space:]]*\\{" {
      in_artifact = 1; url = ""; digest = ""; next
    }
    in_artifact && $0 ~ "^[[:space:]]*\"url\"[[:space:]]*:" {
      line = $0; sub(/^[^:]*:[[:space:]]*"/, "", line); sub(/"[[:space:]]*,?[[:space:]]*$/, "", line); url = line; next
    }
    in_artifact && $0 ~ "^[[:space:]]*\"sha256\"[[:space:]]*:" {
      line = $0; sub(/^[^:]*:[[:space:]]*"/, "", line); sub(/"[[:space:]]*,?[[:space:]]*$/, "", line); digest = line; next
    }
    in_artifact && $0 ~ "^[[:space:]]*\\}[[:space:]]*,?[[:space:]]*$" {
      if (url != "" && length(digest) == 64 && digest ~ /^[0-9a-f]+$/) {
        print url; print digest; exit 0
      }
      exit 1
    }
    END { if (!in_artifact) exit 1 }
  ' <<<"$json"
}

declare -a user_bins=()
IFS=":" read -ra path_entries <<<"${PATH:-}"
for entry in "${path_entries[@]}"; do
  [[ -n "$entry" && "$entry" == "$HOME"/* ]] || continue
  user_bins+=("$entry")
done
default_bin="$DEFAULT_BIN_DIR"
if [[ ${#user_bins[@]} -eq 0 ]]; then
  user_bins+=("$default_bin")
fi
if [[ ! " ${user_bins[*]} " =~ $default_bin ]]; then
  user_bins+=("$default_bin")
fi

if [[ "$ACTION" == "uninstall" ]]; then
  removed=0
  for dir in "${user_bins[@]}"; do
    target="$dir/$BINARY_NAME"
    if [[ -e "$target" ]]; then
      rm -f "$target"
      printf 'Removed %s\n' "$target"
      removed=1
    fi
  done
  if [[ "$removed" -eq 0 ]]; then
    echo "cruma not found in user-local bin directories."
  fi
  exit 0
fi

install_dir="$default_bin"
if [[ -n "$INSTALL_DIR_OVERRIDE" ]]; then
  install_dir="$INSTALL_DIR_OVERRIDE"
fi

for dir in "${user_bins[@]}"; do
  if [[ -x "$dir/$BINARY_NAME" ]]; then
    install_dir="$dir"
    break
  fi
done

mkdir -p "$install_dir"

echo "Resolving ${CHANNEL} channel manifest from ${MANIFEST_URL} ..."
manifest_json="$(curl -fsSL "$MANIFEST_URL")"
case "$(uname -m)" in
  x86_64|amd64) architecture="x86_64" ;;
  aarch64|arm64) architecture="aarch64" ;;
  *) echo "Unsupported Linux architecture: $(uname -m)" >&2; exit 1 ;;
esac

artifact="$(resolve_linux_gnu_artifact "$architecture" "$manifest_json")" || {
  echo "Failed to resolve a valid linux_gnu_${architecture} artifact from ${MANIFEST_URL}" >&2
  exit 1
}
BINARY_URL="${artifact%%$'\n'*}"
EXPECTED_SHA256="${artifact##*$'\n'}"
EXPECTED_TARGET="${architecture}-unknown-linux-gnu"
if [[ -z "$BINARY_URL" || -z "$EXPECTED_SHA256" || "$BINARY_URL" != https://* || "$BINARY_URL" != */"$EXPECTED_TARGET"/cruma ]]; then
  echo "Invalid Linux artifact in ${MANIFEST_URL}" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
echo "Downloading cruma ${CHANNEL} binary into $install_dir ..."
curl -fL "$BINARY_URL" -o "$tmp"
actual_sha256="$(sha256sum "$tmp" | awk '{print $1}')"
if [[ "$actual_sha256" != "$EXPECTED_SHA256" ]]; then
  echo "Downloaded cruma checksum did not match the ${CHANNEL} manifest" >&2
  exit 1
fi
chmod +x "$tmp"
mv "$tmp" "$install_dir/$BINARY_NAME"
trap - EXIT

printf 'Installed cruma binary to %s\n' "$install_dir/$BINARY_NAME"
echo "Add $install_dir to your PATH if it is not already available."
