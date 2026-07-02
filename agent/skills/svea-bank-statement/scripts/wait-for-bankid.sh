#!/usr/bin/env bash
# Poll the active tab until it leaves the BankID login state.
# "Leaving the login state" = the page no longer contains a BankID
# trigger / QR / status text. The exact post-login URL/selector varies,
# so we use a heuristic: wait until document.title or pathname changes
# away from the BankID landing page.
#
# Usage:
#   ./wait-for-bankid.sh            # default 5 attempts × 3s
#   ./wait-for-bankid.sh 10 5       # 10 attempts × 5s
#
# Exits 0 on success, 1 if timeout.

set -euo pipefail

MAX_ATTEMPTS="${1:-5}"
SLEEP_SECONDS="${2:-3}"

# Locate browser-tools
BROWSER_DIR=""
for candidate in \
  "$HOME/.pi/agent/skills/pi-skills/browser-tools" \
  "$HOME/.pi/agent/skills/browser-tools"; do
  if [[ -f "$candidate/browser-eval.js" ]]; then
    BROWSER_DIR="$candidate"
    break
  fi
done

if [[ -z "$BROWSER_DIR" ]]; then
  echo "Error: browser-tools skill not found." >&2
  exit 1
fi

EVAL="$BROWSER_DIR/browser-eval.js"

# Snapshot the current state (before login)
INITIAL_TITLE="$(node "$EVAL" 'document.title' 2>/dev/null || echo "")"
INITIAL_PATH="$(node "$EVAL" 'location.pathname' 2>/dev/null || echo "")"

echo "Waiting for BankID approval..."
echo "  initial title: $INITIAL_TITLE"
echo "  initial path:  $INITIAL_PATH"
echo "  polling up to ${MAX_ATTEMPTS} × ${SLEEP_SECONDS}s"

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  sleep "$SLEEP_SECONDS"
  TITLE="$(node "$EVAL" 'document.title' 2>/dev/null || echo "")"
  PATH_="$(node "$EVAL" 'location.pathname' 2>/dev/null || echo "")"

  # Heuristic: if the title or path changed, we likely left the BankID screen.
  if [[ "$TITLE" != "$INITIAL_TITLE" || "$PATH_" != "$INITIAL_PATH" ]]; then
    echo "Login state change detected (attempt $i)."
    echo "  title: $TITLE"
    echo "  path:  $PATH_"
    exit 0
  fi

  # Also check for a known post-login element (BankID spinner usually says
  # "Logga in" or "BankID"; after auth we expect account/dashboard terms).
  HAS_DASHBOARD="$(node "$EVAL" 'document.body.innerText.includes("Konton") || document.body.innerText.includes("Mina sidor") || document.body.innerText.includes("Översikt")' 2>/dev/null || echo "false")"
  if [[ "$HAS_DASHBOARD" == "true" ]]; then
    echo "Dashboard detected (attempt $i)."
    exit 0
  fi

  echo "  attempt $i/$MAX_ATTEMPTS — still on login"
done

echo "Timed out waiting for BankID approval." >&2
exit 1
