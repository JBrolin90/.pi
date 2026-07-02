---
name: svea-bank-statement
description: Download an account statement (kontobesked / kontoutdrag) from Svea Bank's internet bank at bank.svea.com. Auth uses BankID, so the user must approve on the BankID app. Use when the user wants to fetch a PDF statement from Svea Bank for a specific period.
---

# Svea Bank — Download Account Statement

Automates browser interaction with `bank.svea.com` to download an account statement PDF. Authentication is **BankID** — the agent will pause for you to approve on your phone.

This skill depends on the `browser-tools` skill (Chrome DevTools Protocol). Load it first if not already available.

## Setup (once)

```bash
# Install the browser-tools skill if you don't have it
git clone https://github.com/badlogic/pi-skills ~/.pi/agent/skills/pi-skills
cd ~/.pi/agent/skills/pi-skills/browser-tools && npm install

# Install Playwright (browser-tools depends on it)
npm install -g playwright
npx playwright install chromium
```

## Usage

Invoke the skill with `/skill:svea-bank-statement` and tell the agent the period you want, e.g.:

- "Get my Svea account statement for March 2026"
- "Download last month's kontoutdrag from Svea Bank"
- "Fetch Q1 2026 statement from bank.svea.com"

The agent will walk through the steps below. **You only need to approve the BankID prompt** when it appears.

## High-Level Flow

1. Start Chrome with `--profile` so your BankID cookies / session persist
2. Navigate to `https://bank.svea.com`
3. Trigger BankID login
4. **Pause** — user approves on phone
5. Wait for authenticated dashboard
6. Navigate to Konton / Accounts → Kontobesked / Kontoutdrag
7. Pick the period
8. Trigger PDF download
9. Save to `~/Downloads/svea-statement-<period>.pdf`

## Important Conventions

- **Inspect before clicking.** Use `browser-eval.js` to read page state (DOM, button text) before each interaction. Don't blindly click selectors.
- **Wait for BankID approval.** After triggering BankID, poll until the page leaves the login state (URL changes or authenticated DOM appears). Default poll: 5 attempts × 3s.
- **Don't store credentials.** This skill is credential-free; only your browser's existing session (via `--profile`) is used.
- **Fail loudly on unexpected DOM.** If expected selectors/text aren't found, stop and surface what *is* on the page rather than guessing.

## Helper Scripts

This skill includes small wrappers around the browser-tools primitives. See:

- [`scripts/download.sh`](scripts/download.sh) — **one-shot wrapper**: `./download.sh 2026-05` downloads both accounts for that month, handling Chrome startup, BankID login, and PDF/CSV rename. Supports custom date ranges and per-account selection. This is the entry point you'll use most often.
- [`scripts/start-chrome.sh`](scripts/start-chrome.sh) — launch Chrome with `--profile` on `:9222`
- [`scripts/wait-for-bankid.sh`](scripts/wait-for-bankid.sh) — poll until BankID flow completes
- [`scripts/inspect.sh`](scripts/inspect.sh) — dump page title, URL, and key element text

## Reference

Detailed step-by-step DOM selectors, common failure modes, and troubleshooting are in [`references/flow.md`](references/flow.md).

After you've successfully walked through the flow once, update `references/flow.md` with the exact selectors you observed so future runs are reliable.
