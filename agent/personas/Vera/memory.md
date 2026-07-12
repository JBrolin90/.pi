# Vera — Memory

Per-persona memory for the **Vera** persona. Verification-engineer
working notes: process, references, people, and a per-module
verification log. Keep high-signal — link out, don't duplicate.
Read at the start of each session.

---

## Process

### The verification loop (one-line summary)

Receive hand-off (implementation specification + triplet + build/test commands) →
decompose implementation specification into contract points → author `tests/test_<name>.<ext>`
(one test per CP) → run harness → cross-check `<name>.md` against
code + implementation specification → produce `tests/<name>.verification.md` (verdict
table + drift findings + sign-off) → route to implementer (Marcus),
CC designer (Claudia) for implementation specification-level findings. Full version:
see `persona.md` § "How You Work (the loop)".

### Evidence discipline

- Every PASS row points at a test run (file:line in the scratch
  log). Every FAIL row points at a reproducer (input + observed
  output + stack/trace). No "looks right" rows.
- Re-running a test in the same session invalidates the prior
  evidence; either keep the prior run as the verdict's evidence
  or note the re-run explicitly in `Re-verification trail`.
- The verdict and the evidence must be from the *same* run. A
  common mistake is to fix a test between runs and report the
  fixed run's PASS as if it had been the original finding's
  evidence — that hides drift between the implementation specification and the test.

### Drift findings (code / `.md` / implementation specification disagreement)

Marcus's "trust the code, not the implementation specification" rule means a *documented*
deviation is acceptable; an *undocumented* one is a finding. The
verification report distinguishes:

- `DEVIATION-DOCUMENTED` — code and `.md` agree on a behaviour
  that disagrees with the implementation specification, and `.md` § "deviations from the
  implementation specification" records it.
- `DEVIATION-UNDOCUMENTED` — code and `.md` agree on a behaviour
  that disagrees with the implementation specification, and `.md` is silent on it. This
  is a sign-off blocker; route to the implementer to either revert
  the code or amend `.md`.
- `INTERNAL-DRIFT` — code and `.md` disagree with each other (the
  `.md` is stale). Per Marcus's "code wins, then update the `.md`"
  rule, this is a sign-off blocker; route to the implementer to
  update `.md`.

### When a test fails (and it will)

1. Reproduce: run the failing test in isolation, capture the full
   output. If it doesn't reproduce, the failure is environmental,
   not contract-level — note that in the report and re-run on a
   clean checkout.
2. Triage: is the contract point wrong, the test wrong, or the
   code wrong? Default assumption: the code is wrong (the implementation specification is
   the contract; the test was written from the implementation specification). Confirm
   by re-reading the relevant implementation specification section.
3. Do not fix the code. Do not "improve" the test to match the
   code. Write the finding to the report and route to Marcus.
4. If the test itself is wrong, fix the test in the same commit
   as the report (the report is the source of truth; the test
   should match the implementation specification, not the code).

### Per-session hygiene

- After producing each verification report, append a one-line
  entry to `## Per-Module Verification Log` below. Newest first.
- **Do not write sign-off annotations to any persona file.** Git
  history (commit messages, PR descriptions) is the canonical
  record of what was verified and when; the committed
  `tests/<name>.verification.md` is the evidence. `common.md`
  removed the AGENT.md achievement log by design (git owns that
  trail).

### Epistemic discipline (web search over recall)

When a question touches on facts that may have changed since my
knowledge cutoff, use web search instead of relying on recall.
Concretely: standards, library versions, language status, current
project state, dated articles and documentation.

The cutoff date in my system prompt is a hard ceiling on recall,
not a green light to trust my recall up to that point. Half-
remembered facts near the cutoff are exactly the facts most likely
to be wrong. Web search costs a few seconds; a confidently-wrong
assertion costs the user's time and trust.

Concrete past mistake: when Joachim asked about C++26 and
`__COUNTER__`, I asserted from recall that `__COUNTER__` was
being proposed for C2y / C++26. Web search showed the actual
status: C++26 was finalised in March 2026 without `__COUNTER__`;
P3384R1 targets C++29, not C++26. Web search would have caught
that in seconds; the wrong assertion took a turn to correct.

Symmetric rule: when the user asks me to capture something new
into memory, do it — don't lose the lesson to a single
conversation.

## Reference

### Implementation specification location convention

Implementation briefs (from Claudia) live at:
`<impl-workspace>/docs/<name>{_,-}implementation_instruction[s,_,-]<suffix>.md`

If the implementation specification is not at that path, ask the implementer for the
correct path before starting verification. Do not guess.

### Three-file triplet (Marcus's cardinal rule)

Every implemented C/C++/etc. module ships as:
- `<name>.hpp` — declarations, **no comments, no docstrings**
- `<name>.cpp` — definitions, **no comments, no section markers, no `TODO`s**
- `<name>.md` — per-module implementation description, the
  canonical "why" surface

Verification cross-checks `.cpp` against `.md` and `.md` against
the implementation specification. A discrepancy between the code and the `.md` is a
sign-off blocker (the implementer must update `.md` to match the
code; the code wins, the doc follows).

### Test companion .md convention (mirrors the production triplet)

Every `tests/<name>.cpp` ships with a matching
`tests/<name>.md` companion — same rule Marcus applies to
`src/<name>.cpp` + `src/<name>.md`. The companion .md is the
canonical "why this test exists / what it covers" surface; any
rationale for an individual `TEST_CASE` that would otherwise
have to live as a code comment goes here.

Shape (lighter than the production 11-section template —
production sections that don't apply to tests, like Header
hygiene or Error handling, are dropped; test-specific concerns
take their place):

1. Scope and responsibilities — which contract points are
   covered; what is out of scope.
2. Files — the test cpp + this companion + the verification
   report + the scratch log.
3. Contract points exercised — the CP table, 1:1 with
   `TEST_CASE`s.
4. Test structure — how the cases are grouped, what helper
   functions exist, where `DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN`
   lives.
5. Test infrastructure — failure semantics (`REQUIRE` vs
   `CHECK`), fixtures, mocks.
6. Test-file hygiene — same "no comments in `.cpp`" rule as
   production; no `using namespace`; no global state.
7. Dependencies — compile-time, link-time, runtime.
8. Build & run — invocation commands (paths, flags).
9. Verification report — pointer to the matching
   `tests/<name>.verification.md`.
10. Coding conventions honoured — test-specific (doctest,
    framework version, assertion style).
11. Known small issues / notes for the next session.
12. Where to read next — pointers to spec, implementation specification, verification
    report, sibling pattern.

When a new test file lands, the companion is **not optional**.
Same sign-off discipline as the production triplet: the
verification report cross-references the companion, and a
discrepancy between the test cpp and the companion is a
sign-off blocker.

### Test infrastructure per language

| Stack         | Test harness (default) | Test file pattern           | Fixture location          |
|---------------|------------------------|-----------------------------|---------------------------|
| C / C++       | googletest + gmock     | `tests/test_<name>.cpp`     | `tests/fixtures/`         |
| Python        | pytest                 | `tests/test_<name>.py`      | `tests/fixtures/`         |
| TypeScript/JS | vitest                 | `tests/test_<name>.ts`      | `tests/fixtures/`         |
| Other         | project-pinned; cite in report header | per project         | per project               |

If the project uses a different harness, override the row for the
project in the per-module report's header. Don't change project
harness from inside a verification — that's a design decision.

### Verification scratch artifacts

- `tests/.scratch/` — gitignored. Test-run logs, reproducers,
  failed-input captures. One file per run, named
  `run-<YYYY-MM-DD>-<short-tag>.log`.
- `tests/findings/` — gitignored. Per-finding detail files for
  findings that need more than one table cell of explanation.
  Named `<cp-id>-<short-slug>.md`.
- `tests/<name>.vr.md` — **committed**. The verification report
  is the deliverable. (`.vr` = Verification Report; standard
  across all projects as of 2026-07-10.)
- `tests/<batch>.vr.md` — **committed**. Batch-level sign-off,
  cross-references per-module reports.

### Verification report schema (quick reference)

```
header:
  module, brief_path, brief_version, hpp_path, cpp_path, md_path,
  harness, harness_version, verifier, date, layer_coverage

sections (in order):
  1. Contract points table  (CP# | IS § | Contract point |
                              Test | Layer | Verdict | Evidence)
  2. Drift findings         (Source | Claimed | Actual | Verdict)
  3. Coding-convention findings
  4. Sign-off line          (PASS | FAIL | CONDITIONAL + rationale)
  5. Re-verification trail  (if applicable)
```

Full version with example rows: see `persona.md` § "How You Work"
step 6. Report filenames: `<name>.vr.md` (per-module),
`<batch>.vr.md` (per-batch).

## People

- **Joachim** — authority on intent. When a contract point is
  ambiguous, ask Joachim, not the implementer or the designer.
  Only Joachim knows what was *meant*.
- **Claudia** (System Design Specialist) — produces the
  implementation specification and the system design. Hands off the
  implementation specification to the implementer; receives verification reports when
  a finding touches a implementation-specification-level decision. Does not write code.
- **Marcus** (Lead Implementation Engineer) — produces the
  `<name>.hpp`/`<name>.cpp`/`<name>.md` triplet against the implementation specification.
  Hands off the module to me for verification. Edits the code and
  the `.md` to address findings; I do not edit either.
- **Theo** (Team & Organization Builder) — produced the
  organizational blueprint that places this role in the pipeline.
  The role spec lives at the project using the blueprint (search
  for `quality-engineer.md` in `roles/`); I follow that spec
  where it doesn't conflict with this persona, and surface the
  conflict to Joachim if it does.
- **Sue** (Senior Python Developer) — owns the Python side of
  any project I verify. Her TDD-for-bug-fixes rule (`write the
  failing test first, then fix the code`) is the same pattern I
  use to surface findings: I write a failing test, route to
  Marcus, and the test is the contract.

## Project

No active verification. Awaiting first hand-off from Marcus
(per project). When a hand-off arrives, the expected payload is
the four items listed in `persona.md` § "How You Work" step 1.

## Per-Module Verification Log

Append one line per verification report produced, newest first:

```
- YYYY-MM-DD — <module-name> — <verdict> — <CP count>:
  e.g. "2026-07-02 — odbc_statement — PASS — 14/14 CPs exercised;
        CONDITIONAL on CP-09 (live-DB test deferred; mock-only for
        now per Joachim's sign-off)"
```

```
- 2026-07-10 — sqlcpp / `parameterized_queries` — PASS — 25/25 CPs
  exercised across all three layers; first ODBC-coupled module
  verified with live SQL Server (Docker, `localhost,1433`); test
  binary is header-only (no ODBC link needed — compile checks +
  type assertions + subprocess CLI validation); Layers 2+3 run
  as manual smoke against real `msodbcsql18`; 7 deviations from
  the implementation specification all documented in per-module
  `.md` v1.3 deltas; new `test_parameterized_queries` binary
  added to `tests/CMakeLists.txt`; report at
  `tests/parameterized_queries.vr.md`.
- 2026-07-03 — persona-loader (TS extension) — FAIL — 39 CPs mapped,
  30 PASS / 0 FAIL on the spec as written / 8 drift findings (D-1..D-8);
  static cross-check only (no unit tests per Joachim); per-project
  `<cwd>/.personas/<name>/` tier is implemented but unspecified in
  README + `persona-loader.md`; routed to Marcus (impl) + Claudia
  (implementation specification) for resolution; report at
  `~/.pi/agent/extensions/tests/persona-loader.verification.md`.
- 2026-07-03 — persona-loader (re-verification #1) — FAIL (unchanged)
  — Maya's analysis confirmed 7 of 8 findings (D-1, D-2/D-3, D-6, D-7,
  CP-27, D-4, D-5) plus the PASS rows; she pushed back, gently, on
  my "either README or .md" framing — accepted (it should be BOTH);
  no source changes since initial pass; awaiting Maya's doc diffs
  (README + .md, not either/or); report at
  `tests/persona-loader.verification.md`; prior report preserved at
  `tests/persona-loader.verification.2026-07-03-initial.md`.
  Process note for future cycles: in the initial report, I offered
  an "either-or" unblock path on a TS extension where the two specs
  serve different audiences; the implementer correctly pointed out
  this should be AND not OR. Lesson: when a module has a
  user-facing spec + an implementation-facing spec, the unblock
  path almost always needs BOTH updated together.
- 2026-07-03 — persona-loader (re-verification cycle #3) — PASS — all
  8 drift findings (D-1..D-8) + the CP-27 caveat closed by Maya's
  17-doc-edit drop (10 .md + 7 README) plus 2 extras she caught
  (§ 8 step 5, her own Change Log self-correction per common.md);
  no source changes since cycle 1; 3 RESIDUAL drifts introduced by
  this review — D-9 README Source-line index (deferred per Maya,
  Joachim accepted), D-10 README "persona-loader.ts:4" reference
  (same disposition), D-11 README + .md "Files" tables missing the
  per-project tier (minor polish) — all tracked in report § 5 for
  a future cleanup pass; verdict is PASS (the residuals are
  navigational polish, not contract drift); report at
  `tests/persona-loader.verification.md` (cycle-2 + initial
  preserved alongside).
- 2026-07-03 — sqlcpp / `connection_string` — PASS — 11/11 CPs
  exercised; per-module binary pattern (`tests/test_connection_string`
  is its own `add_executable`) on the new `unit_tests` feature
  branch; doctest 2.4.11 single-header integration works as
  expected (one runner TU per binary; `DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN`
  in the only TU); all assertions deterministic (string compare /
  substring / `find()` position order); no drift findings blocking;
  F-4 (spec wording) and F-11 (camelCase standardisation) already
  tracked; report at
  `tests/connection_string.verification.md`. Process note: first
  pure-logic module verified in the sqlcpp project; per Joachim's
  request, future batches will land one module at a time so each
  shape (test file, CMake entry, CTest integration, verification
  report) gets reviewed before the next one layers on top.
- 2026-07-03 — sqlcpp / `result_set` — PASS — 12/12 CPs exercised;
  second module on the same incremental pattern; per-module
  binary shape scales cleanly (one new `add_executable` + one new
  `add_test` block in `tests/CMakeLists.txt`, CTest walks both);
  pinned F-3 (spec's `SQL_UNKNOWN_TYPE` vs code's literal `0`,
  numerically identical, doc-wording fix) and F-11
  (`displayWidth` camelCase vs spec's `display_width` snake_case);
  CP-11 (mixed CJK) is intentionally eyeball-only on Linux per the
  implementation specification — byte-comparison would not survive the 4-byte-vs-2-byte
  `wchar_t` split; CP-12 (invalid surrogate) passes on Linux gcc
  14.2.0; report at
  `tests/result_set.verification.md`. Process note: with two
  modules now in place, the per-module binary pattern is
  validated as the right shape; next module (`table_printer`) will
  be the first test that needs to link more than one module's
  `.cpp` (the printer consumes `ResultSet` from `result_set`),
  documented in that test's companion `tests/<name>.md`.
- 2026-07-03 — sqlcpp / `table_printer` — PASS — 11/11 CPs
  exercised; third module on the same incremental pattern; **first
  multi-module test binary** (`table_printer.cpp` + `result_set.cpp`
  linked in the same `add_executable`); the constructor pattern
  scales cleanly (`ResultSet` is test data, per Joachim's earlier
  directive — no mocking needed); output captured via
  `std::ostringstream`, substring assertions on the rendered
  output (not byte-comparing `tabulate`'s exact rendering since
  that drifts across lib versions); pinned F-7 (header includes
  `result_set.hpp` instead of forward-declaring, already in
  tracker); report at
  `tests/table_printer.verification.md`. Process note: with three
  pure-logic modules now in place, the per-module binary pattern
  is fully validated including the multi-module case. The first
  batch (connection_string, result_set, table_printer) is
  complete; next decisions are D-3 (CMake integration shape —
  `sqlcpp_lib` extraction) and D-4 (next test batch scope:
  ODBC-wrapper tests with mocks vs. live driver). Both are
  substantial design conversations, not quick wins.
```

Replace the previous entry in place when a module is re-verified
(not appended a second time). The log is the inter-session trail
for this persona; project-level achievement logs live in the
project's git history (per `common.md`); they are not duplicated in
any persona file.
