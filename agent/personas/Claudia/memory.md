# Claudia — memory

Per-persona memory for the **Claudia** persona. Cross-project notes
and reusable structure models. Keep high-signal — link out, don't
duplicate.

---

## Multi-agent project structure — STANDARD

**Apply this to every project worked on by more than one agent (or by
the same agent across multiple Pi sessions).** It isolates agent-facing
context from user-facing artefacts so the two can evolve independently
and concurrent agents never trample each other. Established 2026-06-28
on the sqlcpp POC.

### Layout
```
<project-root>/
├── (build files, source code, README, vendored deps — user-facing)
│   ├── CMakeLists.txt / package.json / …
│   ├── src/ or lib/
│   ├── include/
│   ├── third_party/
│   └── README.md
└── <agent-context-dir>/      # name is a project choice
    ├── AGENT.md              # overview + dated achievement log
    ├── system-design.md      # full design (decisions, architecture, …)
    └── docs/                 # one .md per source file
```

### File roles (inside `<agent-context-dir>/`)
- **`AGENT.md`** — elevator pitch, scope, tech stack, layout pointer,
  build/run pointer, current maturity, **dated achievement log**
  (newest at top). Short; link out for detail.
- **`system-design.md`** (or `<project>-design.md`) — full design:
  decisions and rationale, architecture, component surfaces, data
  model, encoding, errors, build/runtime deps, example session,
  out-of-scope list, open questions.
- **`docs/<source-file>.md`** — one reference per source file: purpose,
  public surface, behaviour/algorithm, error semantics, dependencies,
  notes for implementers. Implemented modules match what was *actually*
  built, including deviations from the spec.
- The user-facing `README.md` lives at the project root and is **not**
  the same as `AGENT.md`.

### Conventions
- `<agent-context-dir>/` is the **single source of truth** for a new
  Pi session. Launch new sessions with cwd set to
  `<project-root>/<agent-context-dir>/`.
- First read on session start: `AGENT.md` (overview + log), then
  `system-design.md` for design detail.
- Files inside `<agent-context-dir>/` describe *what we're building
  and why*; files at the project root are *what we're building*.
- If a doc is useful to the implementer but not to the end user, it
  belongs in `<agent-context-dir>/docs/`, not at the project root.
- Relative links inside `<agent-context-dir>/` use `./` (siblings);
  references to source at the project root use `../src/...`,
  `../include/...`, etc.

### Deviation: per-persona project memory
A project may keep project state in `<cwd>/.personas/<persona>/project.md`
per persona instead of a shared `<project-root>/AGENT.md`. (sqlcpp
does this; see that project's `project.md` for the concrete instance.)

### When to apply
- Multiple Pi sessions or agents collaborating.
- A new agent session needs to get up to speed cold (even solo projects
  benefit).
- A solo throwaway script does **not** need it.

---

## Branches: feature-per-feature

All non-trivial work happens on a **dedicated feature branch**, not on
the day-to-day line.

- **Three-tier branch model.** `main` (stable, tagged releases) ←
  `dev` (day-to-day line, fast-forwardable) ← `feature/<name>` (one
  feature at a time, cut from `dev`). Skip `dev` for small projects
  where a single integration line is enough.
- **Naming.** kebab-case, descriptive of the **feature** —
  `interactive`, `csv-export`, `streaming-results`. Never the agent
  (`claudia/...`, `marcus/...`).
- **One branch, all agents.** No per-agent sub-branches. The PR
  carries the implementation specification + the design + the code together.
- **Lifecycle.** Cut from `dev` → work + smoke-test → squash-merge
  into `dev` → tag the squash → fast-forward `main` → delete the
  feature branch (remote always; local too unless long-running).
- **Docs-only cleanups.** Typos or doc restructurings with no code
  impact ship straight to `dev` (or `main` if `dev` is paused). Don't
  burn a feature branch on docs with no semantic impact.

---

## Process

### Scope discipline
Do exactly what the user asks, nothing else. Don't fill silence with
artefacts, conventions, or decisions that weren't requested. If scope
is ambiguous, ask.

Especially applies to:
- **Persona scaffolding** — designing files, conventions, and project
  notes for new team members is collaboration territory.
- **Implementation specs / implementation specifications** — detailed specs hide the
  reasoning behind decisions; the user can't evaluate one they didn't
  ask for.
- **Convention READMEs / templates** — invented conventions become
  load-bearing even if never agreed.

When in doubt: ask. "Just sit tight" is valid; overreach is not.

### Design-before-code pacing (sqlcpp pattern)
When a new feature lands as a vague name ("add interactive mode",
"add pagination"):

1. Confirm the branch (see *Branches: feature-per-feature*).
2. Capture the architecture in `system-design.md` **before** any
   per-module spec or Marcus implementation specification. One section + open questions is
   enough; don't deep-dive until decisions are made.
3. Update affected per-module specs (e.g. `docs/main.md` for entry
   point changes).
4. Write the Marcus implementation specification.
5. THEN code lands.

Skipping step 2 forces implementation specifications to be rewritten after the first CLI
batch. Example: pinning "eager vs lazy connect" in the design before
the implementation specification prevents restating / retracting.

### ask_user_question labelling gotcha
- **Limits:** 60 chars per option label, 16 chars per header chip.
- Em-dashes and inline backticks eat the budget fast. Keep labels
  ≤55 chars to leave room for `(Recommended)`.
- When a label overflows, the tool rejects the whole batch
  (`Validation failed: questions.N.options.M.label: must not have
  more than 60 characters`). Shorten and resubmit in full — no
  partial-fix path.
- For batched questions, count chars mentally before submitting
  rather than discovering the limit at validation time.
- Put detail in the option description, not the label.

### Concrete questions beat open ones
Batched multiple-choice questions beat free-form "what do you mean?".
Default to 3–4 specific design forks in one batch; users engage with
choices much more than with prose. (sqlcpp interactive-mode: the user
typed a short clarification inside the answer text, which gave the
actual constraint.)

### Deferred improvements → per-project roadmap
When a design session defers something ("we won't do this now"),
**add it to the project's `AGENT.md` § *Future improvements / Roadmap*
immediately** — at the right version bucket (v1.2 / v1.x / long-term)
with a one-line rationale and a source pointer.

Why: scattered "*deferred to v1.2*" notes inside achievement-log
entries get lost. A single section makes the list queryable across
session boundaries.

Cross-link from `system-design.md` § *Open questions* to the
roadmap section. When the deferred item is implemented, move it out
(to a dated achievement-log entry); don't leave it in "current
roadmap" when done — it rots.

For sqlcpp, `AGENT.md` plays this role at
`.personas/Claudia/project.md` (see *Deviation: per-persona project
memory*).

### Cleanup cadence (every few sessions)
`AGENT.md` and `memory.md` accrete. Triggers: milestone hit
(v1 → v1.1 → v1.2), user request, or file past ~200 lines with log
longer than the rest.

Things to look for:
- **Stale maturity notes** — e.g. "POC / pre-implementation" when v1
  has shipped for a week.
- **Stale pointers** — "Next: hand off to implementation" long after
  the ship.
- **Stale tech stack** — new deps appear, superseded items drop.
- **Scattered deferred items** — collapse into Future improvements.
- **Cross-link rot** — links from `system-design.md` § Open questions
  to `AGENT.md` should still point at the right anchor.
- **Per-persona memory** — sections that no longer apply move out or
  archive. Memory is allowed to grow if it stays *high-signal*.

---

## Style

Programming-style defaults for any new project. Per-project
deviations go in the project's `AGENT.md` (or module implementation specifications). Default
unless explicitly overridden.

### C++ / systems
- **C++20 by default** for new C++ work; older codebases stay on
  theirs.
- **`-Wall -Wextra` minimum.** Treat new warnings as
  errors-in-the-making; add `-Werror` once warning-clean.
- **No naked `new` / `delete`.** RAII wrappers everywhere; if a
  C-style handle (ODBC `SQLHANDLE`, file descriptor, …) leaks, wrap
  it in a class with a silent destructor.
- **Headers self-contained** on standard library + project headers
  only. Third-party includes live in `.cpp` unless the header
  genuinely needs the third-party type in its interface.
- **Forward-declare in `.hpp`, full include in `.cpp`.** Multi-class
  modules pair a single `<name>.hpp` + `<name>.cpp`.
- **No exceptions across module boundaries.** Each module catches its
  own failures and surfaces them via return values, error states, or
  local callbacks. The entry-point layer is the only place that turns
  module errors into user-visible output (and a non-zero exit code).
- **No module-level globals, no hidden state.** Function-internal
  `static` helpers are fine. State that ships across calls lives in
  an explicit struct/class passed to the function.
- **`std::cout` for output, `std::cerr` for errors.** Never mix. Pipes
  and redirects work correctly when you do.
- **Readability over cleverness.** No premature optimisation; a
  one-line obvious solution beats a five-line clever one.

### Build / packaging
- **CMake for new C/C++ projects.** Modern CMake (≥ 3.20) with
  `target_*` commands; avoid global `include_directories` /
  `add_compile_options`. Use imported targets produced by
  `find_package` (`ODBC::ODBC`, `Readline::Readline`), not hand-rolled
  `${LIB}_INCLUDE_DIRS` / `${LIB}_LIBRARIES`.
- **No `file(GLOB)`.** List sources explicitly.
- **Vendored single-header libs** under `third_party/`; one shared
  `third_party/README.md` carries provenance (version + date). Never
  a separate README per lib.
- **`find_package(...)` is preferred.** Required deps fail configure;
  optional deps fall through with a configure-time warning (not a
  build error).
- **No install targets, no tests, no packages** unless the user asks.

### Documentation
- **Per-module spec shape.** purpose / public surface / behaviour /
  error semantics / dependencies / notes for implementers. One doc
  per planned `src/<name>.cpp`.
- **Implementation specifications** mirror the spec shape but talk
  to the implementer: where the code goes, what to read first, what
  to implement, smoke-test recipe, conventions, deliverable
  checklist.
- **Achievement-log entries** are dated + one-line summaries + named
  next steps. Details stay in the matching `*.md`; the log is
  chronology.
- **Cross-link don't copy.** Reference the path instead of
  duplicating.

### CLI / REPL / shell-style programs
- **`build/run`** commands in `AGENT.md` in short form, long form in
  `system-design.md`.
- **Exit-code mapping** lives in the entry point only. Pin per-project
  (sqlcpp: ODBC → 1, `std::runtime_error` → 2, other → 3, CLI11 → its
  own code). Keep the table forward-compatible with future wrappers.
- **Smoke tests in layers.** Layer 1 = no external deps (`--help`,
  piped stdin, fakes) — mandatory. Layer 2 = real backend (SQL
  Server). Layer 3 = interactive / TTY-only — documented, sometimes
  skipped.

### Terminology (Joachim's preference)
- **Use formal document names, not informal labels.** The
  per-implementer doc is the *Implementation Specification*
  (capitalised when referring to the document class; lowercase
  mid-sentence). Filename suffix `.is.md` stands for `implementation
  specification`. Applies to every project that produces an
  implementer-facing task doc — set the convention in the project's
  first session, not retrofitted after the codebase accumulates stale
  references.
- **Don't abbreviate document classes in headings or bold labels.**
  When a bullet's bold label is the document type (e.g., **Spec**,
  **Implementation Specification**), don't chain the type with its
  own shorter form (`**Implementation implementation
  specification**`); use the formal name once.

### Communication style (Joachim)
- **Names are literal — case included.** When Joachim writes a name in
  a specific case (branch `UPDATE`, not `update`; `INSERT`/`UPDATE`/
  `DELETE` as a group), he means that exact casing. Don't normalise it
  to a lowercase / kebab-case convention on his behalf. If his casing
  conflicts with a standing convention (e.g., the feature-branch
  kebab-case rule), honour his casing and note the deviation in the
  project memory; don't silently rewrite it.
- **Mixes prose with quoted keywords.** Messages are flowing prose
  with the relevant identifiers quoted inline (`` `DELETE FROM
  <table> WHERE <condition>```, `--password-stdin`). Read the
  backticks as load-bearing, not decorative.
- **Explains intent, not mechanism.** He describes *what* he wants to
  be able to do (``write DELETE FROM <table> WHERE <condition> just
  as well as a select statement``) and expects the agent to infer the
  design — hence his phrase *Please think and propose*. Respond with
  options + trade-offs, not a single silent implementation.
