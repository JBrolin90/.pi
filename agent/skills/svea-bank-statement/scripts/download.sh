#!/usr/bin/env bash
# Download one or both Svea Bank account statements for a given month.
#
# Usage:
#   ./download.sh YYYY-MM                 # both accounts
#   ./download.sh YYYY-MM transaktionskonto
#   ./download.sh YYYY-MM sparkonto
#   ./download.sh 2026-05-01 2026-05-31   # explicit range, both accounts
#
# What it does:
#   1. Make sure Chrome is running on :9222 (with your persistent profile).
#   2. Navigate to the account page and click "Skapa kontoutdrag".
#   3. Set the date range and click create.
#   4. Capture the downloaded CSV via CDP and rename to
#      ~/Downloads/svea-statement-<label>-<YYYY-MM>.csv.
#
# The flow pauses for BankID approval on the first run of the day; subsequent
# runs on the same day usually proceed without re-approval.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- argument parsing ---------------------------------------------------

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [YYYY-MM | YYYY-MM-DD YYYY-MM-DD] [account-label ...]" >&2
  echo "  account labels: transaktionskonto, sparkonto  (default: both)" >&2
  echo "Examples:" >&2
  echo "  $0 2026-05" >&2
  echo "  $0 2026-05-01 2026-05-31 sparkonto" >&2
  exit 1
fi

# Parse first arg as either YYYY-MM or detect that two args are an explicit range
if [[ $1 =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
  YEAR="${1%-*}"
  MONTH="${1#*-}"
  # First and last day of the month (handles leap years via date(1)).
  FROM_DATE="$(date -d "${YEAR}-${MONTH}-01" +%Y-%m-%d)"
  # 'next month - 1 day' is the standard portable trick for last-day-of-month.
  TO_DATE="$(date -d "${YEAR}-${MONTH}-01 +1 month -1 day" +%Y-%m-%d)"
  PERIOD_LABEL="${YEAR}-${MONTH}"
  ACCOUNTS=("${@:2}")
elif [[ $# -ge 2 && $1 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ && $2 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  FROM_DATE="$1"
  TO_DATE="$2"
  PERIOD_LABEL="${FROM_DATE%-*}"
  ACCOUNTS=("${@:3}")
else
  echo "Error: first argument must be YYYY-MM or two YYYY-MM-DD dates." >&2
  exit 1
fi

# Default to both accounts
if [[ ${#ACCOUNTS[@]} -eq 0 ]]; then
  ACCOUNTS=(transaktionskonto sparkonto)
fi

# Account registry. Add new accounts here as one-liners.
# (Account ids and labels are kept here so this script is the single source
# of truth — no need to hardcode them in the agent prompt.)
declare -A ACCOUNT_ID=(
  [transaktionskonto]=9712974
  [sparkonto]=5021551
)

# --- sanity checks ------------------------------------------------------

# Browser-tools must be installed
BROWSER_DIR=""
for candidate in \
  "$HOME/.pi/agent/skills/pi-skills/browser-tools" \
  "$HOME/.pi/agent/skills/browser-tools"; do
  if [[ -f "$candidate/download-statement.mjs" ]]; then
    BROWSER_DIR="$candidate"
    break
  fi
done
if [[ -z "$BROWSER_DIR" ]]; then
  echo "Error: browser-tools skill not found (need download-statement.mjs)." >&2
  echo "Install:" >&2
  echo "  git clone https://github.com/badlogic/pi-skills ~/.pi/agent/skills/pi-skills" >&2
  exit 1
fi

# All requested accounts must be known
for label in "${ACCOUNTS[@]}"; do
  if [[ -z "${ACCOUNT_ID[$label]:-}" ]]; then
    echo "Error: unknown account label '$label'." >&2
    echo "Known: ${!ACCOUNT_ID[*]}" >&2
    exit 1
  fi
done

# --- start Chrome if needed ---------------------------------------------

if ! curl -s --max-time 2 http://localhost:9222/json/version > /dev/null 2>&1; then
  echo "Chrome not running — starting it."
  "$SCRIPT_DIR/start-chrome.sh"
  # Give it a moment to bind the port
  for _ in 1 2 3 4 5; do
    sleep 1
    curl -s --max-time 1 http://localhost:9222/json/version > /dev/null 2>&1 && break
  done
fi

# Set download path silently (no Save dialog)
node "$BROWSER_DIR/set-download-path.mjs" "$HOME/Downloads" > /dev/null

# --- ensure we're logged in --------------------------------------------

node "$BROWSER_DIR/browser-nav.js" "https://bank.svea.com" > /dev/null
TITLE="$(node "$BROWSER_DIR/browser-eval.js" 'document.title' 2>/dev/null || echo "")"
if [[ "$TITLE" == "Logga in - Svea Bank" || -z "$TITLE" ]]; then
  echo "Not logged in — triggering BankID on another device."
  echo "  >>> Please approve the BankID prompt on your phone. <<<"
  node "$BROWSER_DIR/browser-eval.js" \
    '(() => { const b = Array.from(document.querySelectorAll("button")).find(x => x.innerText.trim() === "BankID på annan enhet"); if (!b) throw new Error("BankID button not found"); b.click(); return "clicked"; })()' \
    > /dev/null
  "$SCRIPT_DIR/wait-for-bankid.sh" 15 4
else
  echo "Already logged in (title: $TITLE)."
fi

# --- download each account ---------------------------------------------

for label in "${ACCOUNTS[@]}"; do
  id="${ACCOUNT_ID[$label]}"
  echo ""
  echo "=== Downloading $label (id=$id) for $FROM_DATE to $TO_DATE ==="
  node "$BROWSER_DIR/download-statement.mjs" "$id" "$label" "$FROM_DATE" "$TO_DATE"
done

echo ""
echo "Done. Files in ~/Downloads:"
ls -1 "$HOME/Downloads"/svea-statement-*.csv 2>/dev/null | sed 's|^|  |'
