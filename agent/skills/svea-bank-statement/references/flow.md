# Svea Bank — Detailed Flow

This document is filled in by the agent (or you) after walking through the
flow once with a real session. The more specific it gets, the more reliable
the skill becomes for future runs.

> **Note:** Svea Bank is a financial institution. Be careful with anything you
> write down here — don't paste session tokens, personnummer, account
> numbers, or any identifying data. Only document **structural** details
> (URL paths, element selectors, button text).

## Login

- **URL:** `https://bank.svea.com`
- **Auth method:** BankID (mobile app approval required)
- **Trigger:** page shows two buttons:
  - "BankID på denna enhet" (on this device — requires BankID installed in the Chrome profile)
  - "BankID på annan enhet" (on another device — phone prompt; recommended for headless runs)
- **Selector strategy:** find by `button.innerText.trim()`. React-aria generates
  ids like `react-aria6956266204-_r_2_` that change per render — never rely on them.
- **Post-BankID state:** page navigates to `/dashboard`, title becomes `"Hem - Svea Bank"`.
  The existing `scripts/wait-for-bankid.sh` poll works — it detects a change in
  `document.title` / `location.pathname`, or the presence of the string
  "Konton" / "Mina sidor" / "Översikt" in `body.innerText`.

## Dashboard → Accounts → Statement

- **Top-nav menu items (text → href):**
  - Hem → `/dashboard`
  - Konton och kort → `/accounts`
  - Betala och överför → `/payments`
  - Lån → `/loans`
  - Tjänster → `/services`
  - Meddelanden → `/inbox`
- **Account list:** on `/accounts` each account is an `<a href="/accounts/<id>">`
  with text like `"<Kontonamn>\n<clearing> - <kontonummer>\n<saldo> SEK"`.
- **Account detail:** `/accounts/<id>` — title `"Konto - Konton och kort - Svea Bank"`.
  The page has a tab bar with buttons "Konton" / "Kort" and a primary action
  button **"Skapa kontoutdrag"** (exact spelling — not "kontoutdrag"). Clicking
  it opens a modal dialog with `role="dialog"`.

### Statement dialog ("Skapa kontoutdrag")

- **Title:** "Skapa kontoutdrag"
- **Subtitle:** `"Skapa kontoutdrag från <Kontonamn> (<clearing> - <kontonummer>)"`
- **Notice text:** `"Kontoutdraget sparas i CSV-format (Excel)."` — the bank
  only exports CSV, **there is no PDF option**.
- **Period constraint:** `"Perioden kan max vara 3 månader."` — request must
  be ≤ 3 months. May 2026 alone is fine.
- **Date inputs:** two `<input type="text">` with `name="fromDate"` and
  `name="toDate"`, `placeholder="YYYY-MM-DD"`, accepting `YYYY-MM-DD` only.
  Default is the last 30 days.
  - **Important:** set value via the native setter
    (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set`)
    and dispatch both `input` and `change` (and optionally `blur`) events.
    React's controlled input won't update from a plain `el.value = ...`.
- **Type dropdown:** a `react-select` combobox with `id="react-select-2-input"`
  (the id is stable across renders for a given dialog instance, but the
  numeric suffix may shift if the page refactors — locate by the inner
  `.css-b62m3t-container` ancestor and the `singleValue` text "Transaktioner").
  Options:
  - **Transaktioner** (default — full transaction list)
  - **Betalningar** (payments only)
  There is no "Kontobesked" option in this dialog.
- **Submit button:** in the dialog, a button with text **"Skapa kontoudrag"**
  (note the missing `r` — the bank's UI has a typo: "kont**ou**drag" instead
  of "kont**u**tdrag"). Click it via puppeteer's real `mouse.click(x, y)` on
  the bounding box — `element.click()` works but is slower to register; a real
  pointer event is more reliable.
- **Cancel button:** "Avbryt".

### Output

- File is downloaded by Chrome with name
  `"Transaktioner <fromDate> - <toDate>.csv"` (uses the same wording as the
  dropdown, regardless of whether you picked Transaktioner or Betalningar).
- Content: semicolon-delimited CSV (BOM-prefixed) with header rows
  (account, saldo, kontohavare, org.nr, period) followed by transaction rows
  (datum, meddelande, belopp, valuta, saldo). Opens cleanly in Excel.
- The skill should rename to
  `svea-statement-<account-label>-<YYYY-MM>.csv` in `~/Downloads`.

## Chrome download handling

`element.click()` on the submit button triggers Chrome's download flow, which
shows a **"Save as" / "Spara som" file dialog by default** (the user must
click "Spara" in that dialog for the download to start). For headless / agent
runs you must bypass this:

- Use the CDP command `Browser.setDownloadBehavior` with
  `{ behavior: "allow", downloadPath: "<dir>", eventsEnabled: true }` on a
  CDPSession attached to the browser target. This silently routes downloads
  to `<dir>` with no dialog.
- Listen for `Browser.downloadWillBegin` (gives the suggested filename) and
  `Browser.downloadProgress` (state transitions to `completed`) to know when
  the file is fully written before renaming.
- A working reference implementation lives in
  `~/.pi/agent/skills/pi-skills/browser-tools/download-statement.mjs`.
- Forgetting this step = the user has to click "Spara" in a native dialog
  before the agent can continue, which is the failure mode we hit on the
  first run.

## Common Failure Modes

- **Session timeout:** if the agent pauses too long between BankID approval
  and the next action, the session expires and the page redirects back to
  `/`. Re-run from the login step — no need to restart Chrome.
- **React-aria ids are unstable** (`react-aria<hash>-_r_<n>_<suffix>_`).
  Always locate by `innerText` or stable structural selectors (name, role,
  placeholder). Don't cache them.
- **Date inputs are controlled by React.** Setting `el.value = "..."` silently
  does nothing. Use the native value-setter trick + dispatch `input` + `change`.
- **Submit button typo:** the dialog has a button labelled "Skapa kont**ou**drag"
  (missing `r`). Searching for "Skapa kontoutdrag" will miss it. Search for
  "Skapa kontoudrag" inside the dialog.
- **Save dialog stalls the agent.** Always call `Browser.setDownloadBehavior`
  before the first download, or the user will see a "Spara som" prompt they
  must click manually.
- **Re-using browser-tools scripts:** if Chrome was launched with
  `--profile` and the profile's BankID session is still valid, BankID
  approval is needed each time but no extra password step. A second run on
  the same day usually only takes ~10s.

## Statement File Naming

Statements are downloaded by the browser. With `Browser.setDownloadBehavior`
routing to `~/Downloads`, the skill renames:

```
svea-statement-<account-label>-<YYYY-MM>.csv
```

e.g. `svea-statement-transaktionskonto-2026-05.csv`,
`svea-statement-sparkonto-2026-05.csv`.

The rename step is handled inline in `download-statement.mjs` (no separate
script needed — the `rename-download.sh` placeholder from the original doc
isn't necessary if you call the script with the account label as an
argument).
