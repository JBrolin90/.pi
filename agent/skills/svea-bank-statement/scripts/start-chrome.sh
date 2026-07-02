#!/usr/bin/env bash
# Start Chrome with remote debugging on :9222 and a persistent profile.
# The persistent profile is what preserves your BankID session / cookies
# across runs, so you don't have to re-authenticate every time.
#
# Usage:
#   ./start-chrome.sh                    # default profile dir
#   ./start-chrome.sh /path/to/profile   # custom profile dir

set -euo pipefail

PROFILE_DIR="${1:-$HOME/.cache/svea-bank-chrome-profile}"
mkdir -p "$PROFILE_DIR"

# Find the browser-tools dir (from sibling skill or pi-skills repo)
BROWSER_DIR=""
for candidate in \
  "$HOME/.pi/agent/skills/pi-skills/browser-tools" \
  "$HOME/.pi/agent/skills/browser-tools"; do
  if [[ -f "$candidate/browser-start.js" ]]; then
    BROWSER_DIR="$candidate"
    break
  fi
done

if [[ -z "$BROWSER_DIR" ]]; then
  echo "Error: browser-tools skill not found." >&2
  echo "Install it:" >&2
  echo "  git clone https://github.com/badlogic/pi-skills ~/.pi/agent/skills/pi-skills" >&2
  exit 1
fi

exec node "$BROWSER_DIR/browser-start.js" --profile
