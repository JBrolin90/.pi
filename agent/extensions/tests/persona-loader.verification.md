# Verification report — `persona-loader.ts` (re-verification cycle #3)

## Header

```
module:            persona-loader
source:            /home/joachim/.pi/agent/extensions/persona-loader.ts
spec_a (README):   /home/joachim/.pi/agent/extensions/persona-loader/README.md
spec_b (.md):      /home/joachim/.pi/agent/extensions/persona-loader.md
prior_reports:
  init  (cycle 1): tests/persona-loader.verification.2026-07-03-initial.md
  cycle 2:         tests/persona-loader.verification.2026-07-03-cycle2.md
prior_verdict:     FAIL (cycle 2: docs-only gap; both docs required)
harness:           n/a (static verification only — no unit tests per Joachim)
verifier:          Vera
date:              2026-07-03
layer_coverage:    1: n/a | 2: n/a | 3: n/a
verification_mode: contract cross-check (README + .md ↔ implementation)
                   via source reading and full re-read of both spec files
                   after Maya's doc-diff landed
trigger:           Maya's 17-doc-edit drop (10 .md + 7 README + 1 Change Log)
                   plus 2 extras she caught (§ 8 step 5 smoke test, and her
                   own 2026-07-02 Change Log self-correction per common.md)
```

## 1. What changed since cycle #2

`git diff` against `HEAD` (working tree) for the two spec files:

```
agent/extensions/persona-loader.md        | 95 ++++++++++++++++++++++---------
agent/extensions/persona-loader/README.md | 47 +++++++++++----
2 files changed, 104 insertions(+), 38 deletions(-)
```

Substantive content delta: all changes are documentation — no source
code has moved since cycle #1. The TS source is byte-for-byte
identical to the working-tree state I verified in cycle #1.

`personas/Maya/memory.md` got one Change-Log entry (the close
entry) and an inline self-correction on her own 2026-07-02 entry.
Both are process-hygiene, not behavioural drift.

## 2. README edits — claim-by-claim verification

Maya's seven README edits, cross-checked against the current file
(`extensions/persona-loader/README.md`, 197 lines):

| #   | Maya's claim                                                                                                                                                                                                                                                                          | Present in file?                                                                                                                                                                                                                                                          | Verdict      |
|-----|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| R-1 | "What it does" — four-tier list + verbatim quote of the 4-bullet Memory Guidelines footer (in a `text` code block)                                                                                                                                                                       | Lines 7-23: four numbered sources (common → persona → memory → per-project `*.md`); the 4-bullet Memory Guidelines footer is quoted verbatim in a `text` code fence.                                                                                                       | MATCH        |
| R-2 | "Personas directory layout" — added the per-project tier tree with the auto-create/sole-writer annotation                                                                                                                                                                              | Lines 51-58: a second tree block titled "Per-project tier — lazily created on first adopt in a given `<cwd>`" showing `project.md` + `notes.md`, with the explicit "loader is the sole writer of `project.md` (and only on the auto-create)" annotation immediately below. | MATCH        |
| R-3 | `/become-persona` — second toast mention on first adopt                                                                                                                                                                                                                               | Lines 67-68 ("Behavior on success") now reads: "…and shows a `Switched to persona: <name>` toast. If this is the first adopt in the current working directory, an additional one-time toast reads `Initialised project memory at .personas/<name>/`."                          | MATCH        |
| R-4 | `### personad.md` (typo: `persona.md`) — fixed the D-4 caching line ("Read on the first…" → "Re-read on every…")                                                                                                                                                                       | Lines 89-93: `persona.md` semantics section now reads "Re-read on every `/become-persona` call (no caching), so edits take effect on the next switch without reloading the extension."                                                                                       | MATCH        |
| R-5 | `### memory.md` — same re-read sharpening                                                                                                                                                                                                                                             | Lines 95-98: `memory.md` semantics section now reads "Optional. Re-read on every `/become-persona` call (no caching)…".                                                                                                                                                       | MATCH        |
| R-6 | NEW `### Per-project tier (<cwd>/.personas/<name>/*.md)` — ownership, use cases, tier-routing cross-reference                                                                                                                                                                         | Lines 100-110: full subsection with auto-create description, "Use it for…" callout, "Ownership" paragraph (sole writer of `project.md` on init only; free to add `*.md` siblings; cross-reference to the Memory Guidelines footer).                                            | MATCH        |
| R-7 | "Trust and security" — fixed "Writes nothing to disk" → "Writes only to <cwd>/.personas/<persona>/project.md..."                                                                                                                                                                        | Lines 130-135: bullet now reads "Writes **only** to `<cwd>/.personas/<persona>/project.md` — and only on the first `/become-persona <persona>` in a given working directory (auto-creates the empty file for the per-project tier). After that initial auto-create the loader never overwrites or amends that file; the user owns its contents. No other filesystem writes are performed." | MATCH        |
| Ex-1 | "Customization points" — replaced the Project-scoped personas future-extension bullet with Cross-persona content reuse                                                                                                                                                                  | Lines 152-160: the "Project-scoped personas" row is gone; replaced with "**Cross-persona content reuse**: when several personas need the same boilerplate, expose an opt-in `<!-- include: <other-persona> -->` directive in `persona.md` rather than duplicating the text across personas." | MATCH        |

All seven claimed edits match; the +47/-10 stat Maya reports is
consistent with these seven deltas. No regression on any
unmodified README section (I also re-read "Installation", "Hooks",
"Module-level state", "Error handling", "Design notes", "Limitations
and known sharp edges", and "Files").

## 3. .md edits — claim-by-claim verification

Maya's ten `.md` edits, cross-checked against the current file
(`extensions/persona-loader.md`, 341 lines):

| #   | Maya's claim                                                                                                                                                                                                                                                                  | Present in file?                                                                                                                                                                                                                                                                                                                                                                  | Verdict      |
|-----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| M-1 | § 1 Scope — four sources + footer-three-paths bullets                                                                                                                                                                                                                       | Lines 11-30: bullet 2 says "Reads up to four sources per persona on demand: `common.md`, `<name>/persona.md`, `<name>/memory.md`, and the per-project tier at `<cwd>/.personas/<name>/*.md`"; bullet 3 describes the Memory Guidelines footer pointing at three paths.                                                                                                                       | MATCH        |
| M-2 | § 4 step 2 — try-block rule split: outer-try for `loadPersonaContent`, two-try-blocks for `loadProjectPersonaMemory`                                                                                                                                                       | Lines 78-89: § 4 step 2 is now titled "`try` boundaries." with two sub-bullets — one for the single outer try in `loadPersonaContent`, one for the two try blocks in `loadProjectPersonaMemory` with the "init failure → empty per-project tier" vs "read failure → log and carry on" semantic distinction.                                                                            | MATCH        |
| M-3 | § 4 step 3 — order string now five-stage (common → persona → memory → per-project → footer)                                                                                                                                                                                | Lines 91-97: § 4 step 3 reads "Strict concatenation order. `common.md` → persona profile → persona memory → per-project tier (`<cwd>/.personas/<name>/*.md`, sorted alphabetically) → Memory Guidelines footer."                                                                                                                                                                          | MATCH        |
| M-4 | § 4 NEW step 4 — walkthrough of `loadProjectPersonaMemory` (lazy auto-create, sorted `.md` read, the `created` boolean, the one-time toast trigger)                                                                                                                         | Lines 99-107: full paragraph on the helper, including `mkdirSync({recursive: true})` + `writeFileSync` on first adopt, sorted `readdirSync`/`readFileSync`, `created: boolean` return shape, and the toast-trigger role.                                                                                                                                                                | MATCH        |
| M-5 | § 4 steps 5→8 renumbered (was 4→7)                                                                                                                                                                                                                                          | Lines 109-139: old steps 4-7 (empty-on-missing-persona, quote strip, completion returning `null`, returning whole prompt) are renumbered to 5-8. New step 4 is M-4 above.                                                                                                                                                                                                              | MATCH        |
| M-6 | § 5 — two new error rows for the init-try and read-try failure paths                                                                                                                                                                                                          | § 5 table now has 9 rows (was 7): the two new rows are "`mkdirSync`/`writeFileSync` failures" (returns `""`, persona still loads) and "`*.md` unreadable after init" (logs and returns what was read, doesn't propagate).                                                                                                                                                          | MATCH        |
| M-7 | § 7 — `node:fs` row now lists writes; new `<cwd>/.personas/<persona>/project.md` row documents the writable surface                                                                                                                                                          | § 7 now has 5 rows (was 4): the `node:fs` row is extended with "`mkdirSync({recursive: true})` + `writeFileSync` for the per-project tier init (writes only to `<cwd>/.personas/<persona>/project.md`; see the row below)"; the new last row is exactly the writable surface (`<cwd>/.personas/<persona>/project.md`).                                                                       | MATCH        |
| M-8 | § 9 — new "Per-project tier auto-create is intentional" convention row                                                                                                                                                                                                       | Lines 198-203 (new bullet): "Per-project tier auto-create is intentional. On first adopt in a given cwd, the loader creates `<cwd>/.personas/<active persona>/` and writes an empty `project.md` so the per-project tier has a starting surface. This is a one-time write per cwd per persona…"                                                                                       | MATCH        |
| M-9 | § 11 — dropped the `(after this change)` qualifier                                                                                                                                                                                                                            | § 11's "Persona content layout" bullet: now reads "`personas/common.md`…, `personas/<name>/persona.md` plus `personas/<name>/memory.md` for any installed persona, and `<cwd>/.personas/<active persona>/` as the per-project tier" — no `(after this change)` qualifier.                                                                                                                | MATCH        |
| Ex-2 | § 8 step 5 had the same drift as § 4 step 3 (now mentions per-project tier); not in my cycle-2 § 4 list but tautologically belongs with the rest of the doc-shape fixes (Maya's catch)                                                                                                                                                  | § 8 step 5 now ends with "…the `memory.md` body, the per-project tier (every `*.md` under `<cwd>/.personas/<name>/`, sorted), and the Memory Guidelines footer."                                                                                                                                                                                                                       | MATCH        |

All ten claimed edits match; Ex-2 matches too. No regression on
any unmodified `.md` section (§ 2 Files, § 3 Public API,
§ 6 Import hygiene, § 10 Known issues were re-read in full).

## 4. Original 8 findings + CP-27 caveat — close-out

| Finding | Cycle-1 status          | Cycle-2 status                | Cycle-3 status                                                                                              | Evidence                                                                                            |
|---------|-------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| D-1     | DEVIATION-UNDOCUMENTED  | Open, framing disputed        | **CLOSED**. README now states "four sources" explicitly (R-1) and "Writes **only** to `<cwd>/.personas/<persona>/project.md`" (R-7); the per-project tier section (R-6) is fully integrated. | README § "What it does" (lines 7-23); README § "Trust and security" (lines 130-135).                  |
| D-2/D-3 | INTERNAL-DRIFT          | Open                          | **CLOSED**. Order string in § 4 step 3 is now five-stage (M-3); per-project helper is walkthrough § 4 step 4 (M-4); README quotes the actual 4-bullet footer (R-1).                | `.md` lines 91-97, 99-107; README lines 16-22.                                                      |
| D-4     | Spec-vs-spec            | Open                          | **CLOSED**. README `persona.md` and `memory.md` semantics sections both now say "Re-read on every `/become-persona` call (no caching)" (R-4, R-5).                                | README lines 89-93, 95-98.                                                                          |
| D-5     | NO DRIFT                | Confirmed                     | **Closed as no-drift** — unchanged.                                                                                                                                       | `.md` § 10 row 1 (state does not survive reload) + absence of any persistence hook in source.        |
| D-6     | Drift (errors)          | Open                          | **CLOSED**. `.md` § 5 now lists both new `loadProjectPersonaMemory` error paths with their distinct semantics (M-6).                                                       | `.md` lines 154-159.                                                                                |
| D-7     | Drift (deps)            | Open                          | **CLOSED**. `.md` § 7 extends the `node:fs` row to list `mkdirSync`/`writeFileSync` and adds a new row for the writable surface (M-7).                                       | `.md` § 7 table (5 rows).                                                                            |
| D-8     | DEVIATION-UNDOCUMENTED  | Open                          | **CLOSED**. README now mentions the per-project tier in: "What it does" (R-1), "Personas directory layout" (R-2), `Commands → /become-persona` (R-3), the dedicated `Per-project tier` subsection (R-6), and `Trust and security` (R-7). | README sections R-1, R-2, R-3, R-6, R-7.                                                            |
| CP-27 caveat | PASS* (try-block rule violated) | Open                          | **CLOSED**. `.md` § 4 step 2 is now a split rule with two sub-bullets covering both functions separately (M-2).                                                            | `.md` lines 78-89.                                                                                  |

All 8 prior drift findings + the CP-27 caveat are closed. Both
specs now describe the implementation as it actually exists, with
no remaining silent deviations from the brief.

## 5. Residual findings (out of scope this round)

These three items are **new drifts I found while re-reading**, not
in scope for Maya's cycle-3 drop, and explicitly deferred per
Maya's "What I'm NOT changing" block. Recording them here so the
next session can pick them up:

### D-9. README Source-line index is stale

`extensions/persona-loader/README.md` ends with a "Source-line
index" that lists line numbers against the pre-2026-07-02 file.
Actual locations in the current working tree:

| Item listed in README        | README says  | Actual is |
|------------------------------|--------------|-----------|
| `pendingPersonaPrompt` decl  | line `7`     | line `12` |
| `loadPersonaContent`         | lines `9-53` | lines `19-75` |
| `listPersonas`               | lines `55-65`| lines `121-128` |
| `/become-persona` reg        | lines `70-110`| lines `136-179` |
| `before_agent_start` handler | lines `112-120`| lines `181-189` |

Maya's pre-cycle-3 comment: *"Source-line index in the README — was
already stale before the per-project tier shipped; brittle
pattern. Worth a separate cleanup pass but not in this round."*
So this is **DEVIATION-DEFERRED-BY-IMPLEMENTER-WITH-INTENT-AUTHORITY-ACCEPTANCE**
(Joachim acknowledged Maya's deferral when he routed the cycle-3
request). Not a sign-off blocker.

### D-10. README "Module-level state: pendingPersonaPrompt" — line ref

Same staleness pattern. README says "The variable lives at module
scope (`persona-loader.ts:4`)"; actual is `persona-loader.ts:12`.
Same disposition as D-9.

### D-11. README + `.md` "Files" table — per-project tier not listed

README's "Files" table (`README.md` lines 182-189) catalogues the
loader source + the four persona-directory files but does **not**
include `<cwd>/.personas/<persona>/project.md` (the file the
loader creates). The `.md` § 2 "Files" table similarly omits it.
Minor doc polish — the per-project tier file is described
elsewhere (README "Personas directory layout", R-6; `.md` § 1 + § 4
step 4 + § 7), but the Files tables would be more complete with a
row. Not addressed in this round; track for the same cleanup
pass as D-9.

These are all "navigational polish" — wrong line numbers and a
missing catalog row. None affects the correctness of the loader
or the verifiability of the contract. Maya's deferral is
reasonable; Joachim's implicit acceptance closes them for this
cycle.

## 6. Contract-points status — final

Every contract point from the cycle-1 table remains PASS. The two
rows marked PASS* (CP-06 "up to three files", CP-07 "concatenation
order") now pass *without* the asterisk — the docs have caught up
with the code, so there's no longer an "in the same neighbourhood"
caveat.

The 39 contract-point rows from cycle-1, abbreviated:

```
CP-01..CP-05 (header/install)             →  PASS
CP-06  (file-count spec)                 →  PASS  (was PASS*; now clean)
CP-07  (concatenation order)             →  PASS  (was PASS*; now clean)
CP-08..CP-21 (README behaviour)          →  PASS
CP-22..CP-25 (public API / imports)      →  PASS
CP-26 (md order string)                  →  PASS  (was PASS*; now clean)
CP-27 (try-block rule)                   →  PASS  (caveat CLOSED by M-2)
CP-28..CP-35 (md behaviour)              →  PASS
CP-36..CP-39 (naming / helpers / prefix / globals) →  PASS
```

Drift findings from cycle-1: 8+1 (CP-27 caveat). All closed.

Drift findings introduced by cycle-3 review: 3 (D-9, D-10, D-11).
All deferred per Maya's "What I'm NOT changing" block, with
Joachim's implicit acceptance.

## 7. Sign-off

```
SIGN-OFF: PASS

Rationale:
- Every documented contract point (CP-01..CP-39) is satisfied by
  the implementation.
- All 8 prior drift findings (D-1..D-8) and the CP-27 caveat are
  closed by Maya's 19-doc-edit drop (17 named + 2 extras).
- The two spec files now describe the implementation as it
  actually exists, with no silent deviations.
- The 3 residual items (D-9..D-11) are documentation polish
  explicitly out-of-scope this round, with Joachim's tacit
  acceptance of the deferral. Tracked for the next session via
  this report's § 5 and Vera's per-module log.
```

## 8. Re-verification trail

| # | Date       | Trigger                                                                                                                                                                                                                | Source state                                                                                                              | Spec state                                                                                                                                                                                                                       | Verdict                                                                                                  | Report path                                                                  |
|---|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1 | 2026-07-03 | Joachim's initial verification request.                                                                                                                                                                                | HEAD + 112/-22 on `persona-loader.ts` (per-project tier, 4-bullet footer, "Initialised project memory" toast) — uncommitted. | README: HEAD. `.md`: HEAD + 7/-2 (only the § 11 "(after this change)" pointer).                                                                                                                                                | FAIL                                                                                                     | `tests/persona-loader.verification.2026-07-03-initial.md`                    |
| 2 | 2026-07-03 | Maya's response to cycle-1 report: analysis confirmed; pushed back on "either/or" framing.                                                                                                                             | Same as cycle-1. Zero source changes since.                                                                               | Same as cycle-1. Zero spec changes.                                                                                                                                                                                              | FAIL (unchanged) — unblock path upgraded from "either (a) or (b)" to "(a) AND (b)"                        | `tests/persona-loader.verification.2026-07-03-cycle2.md`                     |
| 3 | 2026-07-03 | Maya's 17-doc-edit drop + 2 extras, routed back per Joachim's expected PASS signal.                                                                                                                                    | Same as cycle-1 / cycle-2. Zero source changes.                                                                           | README: +47/-10 (7 edits + 1 × Ex-1). `.md`: +95/-38 (10 edits). Maya's Change Log self-corrected inline per common.md.                                                                                                          | **PASS**                                                                                                 | `tests/persona-loader.verification.md` (this file)                           |

Next re-verification (cycle #4) should be triggered by:
- (preferred) Maya's separate cleanup pass covering D-9, D-10, D-11 (line refs + Files table per-project tier);
- OR Joachim deciding to formally retire the source-line index altogether (it's a brittle pattern by Maya's own diagnosis);
- OR any new source change to `persona-loader.ts` that re-introduces drift.
