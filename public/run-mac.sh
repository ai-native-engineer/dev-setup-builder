#!/bin/bash
set -euo pipefail

if [ -z "${DEV_SETUP_SCRIPT_B64:-}" ]; then
  printf "DEV_SETUP_SCRIPT_B64 is missing.\n" >&2
  exit 1
fi

tmp="${TMPDIR:-/tmp}/dev-setup-builder-$$.command"
if ! printf "%s" "$DEV_SETUP_SCRIPT_B64" | base64 -D > "$tmp" 2>/dev/null; then
  printf "%s" "$DEV_SETUP_SCRIPT_B64" | base64 --decode > "$tmp"
fi

chmod +x "$tmp"
bash "$tmp"
