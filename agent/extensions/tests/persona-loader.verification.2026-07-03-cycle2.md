# Verification report — `persona-loader.ts` (re-verification #1)

## Header

```
module:           persona-loader
source:           /home/joachim/.pi/agent/extensions/persona-loader.ts
spec_a (README):  /home/joachim/.pi/agent/extensions/persona-loader/README.md
spec_b (.md):     /home/joachim/.pi/agent/extensions/persona-loader.md
prior_report:     /home/joachim/.pi/agent/extensions/tests/persona-loader.verification.2026-07-03-initial.md
                   (renamed 2026-07-03 to preserve the post-Maya-state snapshot)
prior_verdict:    FAIL — see Re-verification Trail § 6
harness:          n/a (static verification only — no unit tests per Joachim)
verifier:         Vera
date:             2026-07-03
layer_coverage:   1: n/a | 2: n/a | 3: n/a
verification_mode: contract cross-check (README + .md ↔ implementation)
                  via source reading and git diff; no execution
trigger:          Implementer (Maya) review of the initial report — analysis
                  confirmed most findings; doc diffs have NOT been produced yet
                  (see § 6, "Re-verification Trail", for what changed)
```

## 1. What changed since the initial report

`git diff` against `HEAD` (working tree, uncommitted) confirms that
**the only file changes since the initial report are Maya's own
uncommitted edits to `persona-loader.ts` and `persona-loader.md`
already present at the time of the initial verification**, plus her
own `personas/Maya/memory.md` change-log entry. No new source
modifications have been introduced. Specifically:

- `persona-loader.ts` (192 LoC in working tree; +112/-22 vs HEAD) —
  same state I read on the initial pass. The diff includes the
  additions of `PersonaLoadResult`, `loadProjectPersonaMemory`, the
  4-bullet "Memory Guidelines" footer, and the new
  `Initialised project memory at …` toast. **No code changes since
  initial verification.**
- `persona-loader.md` (+7/-2 vs HEAD) — same state I read on the
  initial pass. The only edit is the § 11 "(after this change)"
  pointer to `<cwd>/.personas/<active persona>/` as the per-project
  tier (the line I cited in finding D-2). **No doc rewrite since
  initial verification.**
- `persona-loader/README.md` (no diff vs HEAD) — completely
  untouched. The README still asserts "Writes nothing to disk
  itself", "Reads up to three markdown files per persona", "Memory
  Guidelines footer that points the agent at the persona's
  `memory.md`", and lists "Project-scoped personas" under
  Customization points. **No README update since initial
  verification.**

Therefore the contract-points table from the initial report stands
unchanged. The CP rows from `persona-loader.verification.2026-07-03-initial.md`
remain valid as of today (no source/doc moved under them); this
report focuses on (a) confirming Maya's analysis, (b) upgrading
the unblock path from "either (a) or (b)" to "both (a) and (b)", and
(c) recording the dialogue trail.

## 2. Maya's response — analysis confirmation

Maya's reply is captured verbatim into a working table below. For
each of her claims I cross-checked against the source/specs in the
initial report and confirm or correct:

| Maya's claim                                                                                                       | My initial finding                                                                                                                                                                | Verdict on Maya's claim                                                                                                |
|--------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| "D-1 (README 'up to three files') is real."                                                                        | D-1 in § 2 of initial report: README §-body says "Reads up to three markdown files per persona"; code reads a 4th tier.                                                            | CONFIRMED. Evidence: `persona-loader.ts:81-119` (`loadProjectPersonaMemory`); README.md line describing "three files".     |
| "README 'Writes nothing to disk itself' is now false because `loadProjectPersonaMemory` calls mkdirSync + writeFileSync on first adopt." | D-1 sub-finding: "the implementation invokes `fs.mkdirSync` and `fs.writeFileSync` … README § 'Trust and security' asserts: 'Writes nothing to disk itself.' That claim is now false." | CONFIRMED. Evidence: `persona-loader.ts:88-94` (`mkdirSync` + `writeFileSync("")`). README "Trust and security" paragraph unchanged. |
| "README lists 'Project-scoped personas' as a future extension when it's now a shipped feature."                    | D-1 / D-8 in initial report: README "Customization points" describes the feature as a future extension.                                                                          | CONFIRMED. Evidence: README "Customization points" still includes the project-scoped-personas row verbatim.              |
| "D-2 / D-3 (Memory Guidelines footer) is real."                                                                    | D-3 in initial report.                                                                                                                                                            | CONFIRMED. Code has 4 bullets + the "achievement log" prohibition; README describes the footer in singular terms.       |
| "D-6 / D-7 (.md § 5 and § 7) is real."                                                                             | D-6, D-7 in initial report.                                                                                                                                                       | CONFIRMED. Two new `console.error` paths in `loadProjectPersonaMemory` not in error-handling table; cwd write not in dependencies table. |
| "CP-27 caveat (one try per file): also my fault. The .md § 4 step 2 rule says 'one try around the entire read block'; the per-project tier introduces a separate function with its own two try blocks." | CP-27 PASS* in initial report noted that `loadProjectPersonaMemory` has its own try blocks despite the .md rule.                                                                  | CONFIRMED. Code has `try { … }` at `persona-loader.ts:23-71` (outer), and **two** additional `try { … }` blocks at lines 86-95 and 102-114 — three tries total. |
| "D-4 (caching): Vera is right that the .md matches the code and the README is the one lying."                       | D-4 in initial report: README and `.md` disagree; `.md` and code agree.                                                                                                          | CONFIRMED. Verbatim: README says `persona.md` is "Read on the first `loadPersonaContent` call after a `/become-persona`" (caching-framed); `.md` § 9 and code re-read on every call. |
| "CP-01..CP-39 PASS + C-1..C-9 PASS: that's the part I'm not disputing. The drift is one-sided: specs lag the code." | Initial sign-off: 30/30 spec rows PASS, 0 FAIL on the spec as written; all drift findings go in the same direction (specs ≤ code).                                              | CONFIRMED. Source is conformant; the gap is documentation-only.                                                          |
| "D-5 (no persistence): correctly identified as 'no drift'."                                                        | D-5 in initial report marked "NO DRIFT — verification only."                                                                                                                      | CONFIRMED. `pendingPersonaPrompt` is module-level only; no `session_start` hook; no persistent storage.                   |

**Summary**: All eight of Maya's confirmations line up with my
findings. There is no new disagreement on facts.

## 3. Maya's gentle push-back — accepted

Maya's push-back on the unblock path: "I'd push back, gently:
Vera offers 'either (a) update the README OR (b) update the .md'
as alternatives. I'd argue the per-project tier needs **both**."

Her argument: the two docs play different roles (README =
user-facing, `.md` = implementation-facing), so the doc updates
travel as a pair, not as alternatives. Her reasoning:

- README rewrite must cover: (1) "< 4 markdown files per persona →
  up to N (depending on `<cwd>/.personas/<name>/` contents)"; (2)
  the new toast; (3) the rewording of the "Memory Guidelines"
  footer section to quote the actual four-bullet block; (4) the
  revised "Trust and security" claim; (5) moving "Project-scoped
  personas" out of "Customization points".
- `.md` rewrite must cover: (1) the new helper in § 4; (2) the
  broadened try-block rule in § 4 step 2 (or a note that
  `loadProjectPersonaMemory` is a separate concern); (3) the
  revised order string in § 4 step 3 (now five stages); (4) the
  two new error rows in § 5; (5) the cwd-write row in § 7; (6) the
  auto-create behaviour in § 9 or § 10.

**My stance**: AGREED. The "either (a) or (b)" framing I used in
the initial report was too binary. The two specs serve different
audiences and Maya's split is the right way to apportion the work.
This was a real (though minor) framing error in my initial report.

## 4. Updated unblock path (replaces § 4 of the initial report)

The initial report offered "either (a) rewrite the README OR (b)
amend `.md`". The updated unblock path is **(a) AND (b)**, not
either. Both doc diffs are required because the two docs serve
different audiences; updating one and leaving the other stale
would leave at least one audience misinformed.

To unblock sign-off, Maya should apply **both** of the following
amendments in a single pair of doc commits (source unchanged):

**(a) `persona-loader/README.md` updates** — user-facing:

| README section         | Current claim                                                                                                       | Required update                                                                                                                                                              |
|------------------------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| "What it does"         | "reads up to three markdown files per persona"                                                                      | Replace with: "reads the three global persona files (`common.md`, `<name>/persona.md`, `<name>/memory.md`) plus a fourth, per-project tier at `<cwd>/.personas/<name>/` …"     |
| "Memory Guidelines" (sub-section under "Persona file semantics") | "footer that points the agent at the persona's `memory.md`"                                                          | Update to quote the actual four-bullet block (`cross-project persona memory`, `per-project persona memory`, `shared project spec`, the CRITICAL rule with the achievement-log prohibition). |
| "Trust and security"   | "Writes nothing to disk itself."                                                                                    | Replace with: "Writes only to `<cwd>/.personas/<persona>/project.md`, lazily on first adopt in a given cwd. Reads everything else."                                          |
| "Customization points" | Includes "Project-scoped personas: read `<cwd>/.pi/personas/` and merge with the global directory" as a future extension. | Remove the row (now shipped) and replace with a different customization example. Also note that the shipped shape is `<cwd>/.personas/<name>/`, **not** `<cwd>/.pi/personas/`.  |

**(b) `persona-loader.md` updates** — implementation-facing:

| `.md` section          | Current claim                                                                                                       | Required update                                                                                                                                                              |
|------------------------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| § 1 Scope              | "Reads up to three files per persona on demand"                                                                     | Replace with a four/five-tier description that includes the per-project tier and lists the cwd-write as a side-effect.                                                       |
| § 4 Implementation walkthrough, step 2 ("One try around the entire read block") | Single-function rule                                                                                               | Either widen the rule to "one try per independent read phase, each with its own failure semantic" **or** add a note explaining that `loadProjectPersonaMemory` is a separate concern with two of its own try blocks because its first phase has write-as-side-effect semantics. Either is defensible; the current rule-as-stated is now false. |
| § 4 step 3 ("Strict concatenation order")   | "common.md → persona profile → persona memory → Memory Guidelines footer"                                            | Update to the actual five-stage order: `common → persona → memory → per-project memory → Memory Guidelines footer`.                                                            |
| § 4 (new step or annex)                  | No description of `loadProjectPersonaMemory`                                                                       | Add a step or sub-section describing the per-project helper: lazy auto-create, `<cwd>/.personas/<name>/`, sorted-`*.md` read, the `created` flag, the caller-conditional toast.        |
| § 5 Error handling                       | Lists outer try only                                                                                                | Add two rows for `loadProjectPersonaMemory`'s new error paths: `failed to initialise project memory for "<name>"` (write/side-effect failure) and `failed to read project memory for "<name>"` (readdir/readfile failure). Note that in the read path the loader carries on with `content = ""` and returns, so the persona is still applied. |
| § 7 Dependencies                         | Three runtime deps (`node:fs`, `node:os`, `node:path`), all reads                                                    | Add a row noting the cwd-write surface: `fs.mkdirSync({ recursive: true })` and `fs.writeFileSync("", "utf-8")` against `<cwd>/.personas/<active persona>/`.                  |
| § 9 Coding conventions                   | No mention of the auto-create                                                                                      | Add a row: "On first adopt in a given cwd, the loader creates `<cwd>/.personas/<active persona>/` and writes an empty `project.md`. This is intentional — see § 1 (Scope)."     |
| § 11 "Where to read next"                | Already updated to "(after this change) `<cwd>/.personas/<active persona>/`…"                                       | Drop the "(after this change)" qualifier once the rest of the doc is updated.                                                                                                |

**Both diffs together, no source changes**: the implementation is
already correct against the *intent*; only the documentation lags.
Per Marcus's "trust the code, not the brief" rule, the
documentation must catch up — and for this module, both docs must
catch up together, not one at a time.

## 5. Sign-off

```
SIGN-OFF: FAIL (unchanged from the initial report).

Rationale:
- All 30 contract-point rows from the initial report remain PASS;
  no source regression has introduced a new FAIL.
- All eight findings (D-1..D-8) remain valid; Maya has confirmed
  seven of them outright (D-1, D-2/D-3, D-6, D-7, CP-27, D-4,
  D-5). The eighth (D-8, README completeness) is confirmed by
  D-1's sub-findings.
- Maya's push-back on my framing (binary "either (a) or (b)")
  is accepted; the unblock path is now "both (a) and (b)" with
  the concrete edits above.
- No source changes are required for sign-off; the gap is purely
  documentation.
- Sign-off will turn PASS once Maya applies BOTH doc diffs
  (README + .md) listed in § 4 above and the new state is
  re-verified (re-verification cycle #2).

Source is conformant to intent; documentation is the bottleneck.
```

## 6. Re-verification trail

| # | Date       | Trigger                                                                                                       | Source state                                                                                                                                                                                                                  | Spec state                                                                                                                                                                                  | Verdict      | Report path                                                                                          |
|---|------------|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------------------|
| 1 | 2026-07-03 | Joachim's initial verification request.                                                                       | Uncommitted working tree (HEAD + 112/-22 on `persona-loader.ts`). `PersonaLoadResult`, `loadProjectPersonaMemory`, 4-bullet footer, "Initialised project memory" toast all present.                                            | README: HEAD (Jul 2 10:03). `.md`: HEAD + 7/-2 (only the § 11 "(after this change)" pointer added).                                                                                        | FAIL         | `tests/persona-loader.verification.2026-07-03-initial.md` (renamed from `persona-loader.verification.md`) |
| 2 | 2026-07-03 | Maya's response to the initial report (analysis + push-back on "either/or"). Joachim requests re-verification. | Same as row 1. `git diff` confirms zero changes to source files since the initial verification.                                                                                                                                | Same as row 1. `git diff` confirms zero changes to either spec file since the initial verification (no new doc edits applied).                                                              | FAIL         | `tests/persona-loader.verification.md` (this file)                                                                                                                |

Next re-verification (cycle #3) should be triggered by either Maya
applying the § 4 doc diffs, Joachim deciding to revert the source,
or Joachim deciding the per-project tier should be removed
altogether (in which case `persona-loader.ts:81-119` and the § 4 /
§ 5 / § 7 / § 9 / § 11 references on the doc side are all moot).
