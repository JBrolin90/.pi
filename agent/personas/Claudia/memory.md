# Claudia — memory

Per-persona memory for the **Claudia** persona. Cross-project notes
and reusable structure models. Read at the start of each session.
Keep high-signal — link out, don't duplicate.

---

## Multi-agent project structure — STANDARD (remember & apply)

**Remember this. Apply it to every project that will be worked on by
more than one agent (or by the same agent across multiple Pi
sessions).** It isolates agent-facing context from user-facing
artefacts so the two can evolve independently and so concurrent agents
never trample each other. Established 2026-06-28 after restructuring
the sqlcpp POC.

### Layout
```
<project-root>/
├── (build files, source code, README, vendored deps — user-facing)
│   ├── CMakeLists.txt / package.json / …
│   ├── src/ or lib/
│   ├── include/
│   ├── third_party/
│   └── README.md
└── <agent-context-dir>/      # multi-agent context (name is a project choice)
    ├── AGENT.md              # project overview + dated achievement log
    ├── system-design.md      # full design (decisions, architecture, …)
    └── docs/                 # one .md per source file (purpose, API, …)
```

### Concrete instance
- **sqlcpp** (POC, est. 2026-06-28) chose `system_agent/` as the
  `<agent-context-dir>`. As of 2026-07-02 the spec content was moved
  out of `system_agent/AGENT.md` and into
  `<cwd>/.personas/Claudia/project.md` — sqlcpp chose the
  per-persona project-memory layout instead of `<cwd>/AGENT.md`
  (per-project deviation from the three-tier standard). The
  `system_agent/` tree is kept on disk only for the design artefacts
  (`system-design.md` + `docs/`); cut a fresh `system_agent/AGENT.md`
  later if/when a shared spec is wanted again. Use the sqlcpp
  instance as the reference when applying the per-persona
  variant of the pattern.

### Conventions
- `<agent-context-dir>/` is the **single source of truth** that a new
  Pi session reads to get up to speed. Launch new sessions with the
  working directory set to `<project-root>/<agent-context-dir>/`.
- **`AGENT.md`** — elevator pitch, scope, tech stack, layout pointer,
  build/run pointer, current maturity, and a **dated achievement log**
  (newest entry at the top). Keep short; link out for detail.
- **`system-design.md`** (or `<project>-design.md`) — the full design:
  decisions and rationale, architecture, component surfaces, data
  model, encoding, errors, build/runtime deps, example session,
  out-of-scope list, open questions.
- **`docs/<source-file-name>.md`** — one reference doc per source file,
  each covering: purpose, public surface, behaviour/algorithm, error
  semantics, dependencies, notes for implementers.
- The user-facing `README.md` lives at the project root and is **not**
  the same as `AGENT.md`.

### Rules of thumb
- Files inside `<agent-context-dir>/` describe *what we're building and
  why*; files at the project root are *what we're building*.
- If a doc is useful to the implementer but not to the end user, it
  belongs in `<agent-context-dir>/docs/`, not at the project root.
- Relative links inside `<agent-context-dir>/` use `./` (siblings);
  references to source code at the project root use `../src/...`,
  `../include/...`, etc.
- When a new agent session starts, the first thing it should do is
  read `AGENT.md` (overview + achievement log) to understand current
  state, then `system-design.md` for the design.

### When to apply
- Any project where multiple Pi sessions (or multiple agents) will
  collaborate.
- Any project where a new agent session needs to get up to speed from
  a cold start (even solo projects benefit from the structure).
- A solo throwaway script does **not** need this structure.

### Branches: feature-per-feature
All non-trivial work happens on a **dedicated feature branch**, not
on top of the day-to-day line. The general pattern:

- **Three-tier branch model**: `main` (stable, tagged releases) ←
  `dev` (day-to-day working line, fast-forwardable) ←
  `feature/<name>` (one feature at a time, cut from `dev`).
  Skip `dev` if the project is small and a single integration line
  is enough.
- **Naming**: kebab-case lower-case, descriptive of the **feature**
  — e.g. `interactive`, `csv-export`, `streaming-results`. Not
  the agent — avoid `claudia/...`, `marcus/...`. The branch is
  about what's being built, not who built it.
- **Lifecycle**: cut from `dev` → all agents commit on the **same**
  branch (no per-agent sub-branches; the design brief + the
  implementation land together as one PR) → squash-merge into
  `dev` when feature-complete + smoke-tested → tag the squash
  commit → fast-forward `main` to the tag.
- **Docs-only cleanups** (typos, doc restructurings with no code
  impact) ship straight to `dev` (or `main` if `dev` is paused);
  don't burn a feature branch on docs that have no semantic
  impact.
- **Always delete the remote feature branch** after squash-merge;
  keep the local one for archaeology only when the work was
  long-running or hard-to-replay. Otherwise drop the local too
  to avoid branch noise.
- **Both agents commit on the same feature branch.** The
  implementer does **not** get their own branch — the PR
  contains the brief + the design + the code, all on one branch.

### Files inside `<agent-context-dir>/`
- `AGENT.md` holds **project-specific** state only: project
  overview, scope, tech stack (with versions / vendored libs),
  repo-layout pointer, build/run commands, current maturity,
  active-branch pointer, deferred-items roadmap, achievement log.
  Keep short; link out for detail.
- `system-design.md` (or `<project>-design.md`) holds the full
  design: decisions with rationale, architecture, component
  surfaces, data model, encoding, errors, build/runtime deps,
  example session, out-of-scope list, open questions.
- `docs/<source-file>.md` — one reference doc per planned source
  file (purpose / public surface / behaviour / error semantics /
  dependencies / notes). Implemented modules get a matching
  `docs/<source-file>.md` describing what was *actually* built
  (including deviations from the spec).
- The user-facing `README.md` lives at the project root and is
  **not** the same as `AGENT.md`. AGENT.md is for agents; README
  is for users.

### Implementation workspace — briefs in `docs/` (est. 2026-07-02)

When the project also has a **parallel implementation workspace**
(e.g. `implementation_agent/`) with its own `src/`, `include/`,
`CMakeLists.txt`, etc., it gets its own `docs/` directory with a
**strict rule**:

- **Implementation briefs (from Claudia → for the implementer) live
  in `<impl-workspace>/docs/<name>{_,-}implementation_instruction{s,}.md`.**
  Every module that has a brief must put the brief in `docs/`,
  never in `src/`. The filename keeps the `_implementation_instruction[s]`
  suffix so it remains unambiguous if/when description files move
  in too.
- **Per-module implementation descriptions (written by the
  implementer, describing what was actually built — including
  deviations from the brief) live in `<impl-workspace>/src/<name>.md`**
  alongside the `.cpp`. Description follows the code; the brief
  is a separate, more upstream artefact.
- **Result:** `<impl-workspace>/src/` contains only the
  implementer's deliverables (`.cpp` + `<name>.md`); `<impl-workspace>/docs/`
  contains only the designer's deliverables (briefs). Clean
  separation of concerns, no per-agent confusion about which
  file is whose.
- The implementation workspace's own `AGENT.md` is the first
  thing the implementer reads; it owns the module-status table
  and the "Local conventions" section. Point every module row
  at `docs/...`, not `src/...`.
- The pattern is symmetric with `<agent-context-dir>/docs/` (which
  holds Claudia's per-component specs): each side has a `docs/`
  for *its* type of upstream artefact, and a `src/` (or no `src/`)
  for *its* type of delivered artefact.

**Concretely (sqlcpp instance):** the eight briefs
(`connection_string_builder-`, `interactive_mode-`, `main-`,
`odbc_connection-`, `odbc_env-`, `odbc_statement-`, `result_set-`,
`table_printer_implementation_instructions.md`) all live in
`implementation_agent/src/` — sqlcpp **deviates** from the
separated-into-`docs/` rule above; no `implementation_agent/docs/`
was ever created. Marcus's per-module descriptions
(`connection_string.md`, `interactive_mode.md`, …) live in the
same `src/` directory; the `_implementation_instruction[s]` suffix
keeps the two roles unambiguous. As of the 2026-07-02 move, briefs
that point at project state use `<cwd>/.personas/Claudia/project.md`
(was `../system_agent/AGENT.md`).

---

## Process

### Design-before-code pacing (sqlcpp pattern)

When the user asks for a new feature with a vague name ("add interactive
mode", "add pagination"), the pattern that works:

1. Confirm the branch (use feature branches — see *Multi-agent project
   structure — STANDARD* § Conventions).
2. Capture the architecture in `system-design.md` **before** any
   per-module spec or Marcus brief. Even one section + an
   open-questions list is enough; don't deep-dive until decisions are
   made.
3. Update the affected per-module specs (e.g. `docs/main.md` for entry
   point changes) to match.
4. Then write the Marcus brief.
5. THEN code lands.

Skipping step 2 leads to briefs that have to be rewritten after the
first CLI batch (e.g. "eager vs lazy connect" is a big enough decision
that pinning it in the design before the brief prevents
restating / retracting).

### ask_user_question labelling gotcha

The `ask_user_question` tool has a **60-character limit on option
labels** and a 16-character limit on header chips. Em-dashes and
inline backticks eat the budget fast. Keep labels ≤55 chars to leave
room for `(Recommended)` or similar suffixes. Verbatim labels I've
sent through fine look like `"< 5 words> (Recommended)"` or
`"Yes — <verb> <noun> (Recommended)"`. Never put a long phrase in a
label; put detail in the description instead.

When a label overflows, the tool rejects the whole batch with
`Validation failed: questions.N.options.M.label: must not have more
than 60 characters`. Shorten the offending label and resubmit in
full (no partial-fix path). For batched questions, run the labels
through a mental char counter before submitting rather than
discovering the limit at validation time.

### Concrete questions beat open ones

When the user gives me a vague feature request, batched
multiple-choice questions are far more useful than free-form "what
do you mean?". In the sqlcpp interactive-mode session the user
typed a short clarification ("kind of like 1 but...") inside their
answer text, which gave me the actual constraint (commands-not-
prompt-for-SQL). Default to asking 3–4 specific design forks in one
batch; users engage with the choices much more than with prose.

### Deferred improvements → AGENT.md Future improvements

When a design session produces an explicit "we won't do this now"
decision (the user skipped it, the scope is too big, it depends on
something else), **add it to the project's `AGENT.md` § *Future
improvements / Roadmap* immediately** — at the right version bucket
(v1.2 / v1.x / long-term) with a one-line rationale and a source
pointer (which achievement-log entry or design section deferred it).

Why: scattered "*deferred to v1.2*" / "*out of scope*" notes inside
achievement-log entries get lost. The next session has no way to
find them. A single section in `AGENT.md` makes the deferred list
queryable and lets it survive session boundaries cleanly.

Cross-link from `system-design.md` § *Open questions* so a reader
following the design hit knows where the deferred things live.

When the deferred item is later implemented, move it out of the
roadmap (to a dated achievement-log entry); don't leave it in
"current roadmap" when it's done — it rots.

### Cleanup cadence (every few sessions)

`AGENT.md` and `memory.md` both accrete. Every few sessions, take a
manual sweep. Things to look for:

- **Stale maturity notes** — e.g. "POC / pre-implementation" when
  v1 has shipped for a week. Update to reflect the current state.
- **Stale pointers** — "Next: hand off to implementation" when
  implementation has long since shipped. Drop them.
- **Stale Tech stack** — new deps added (libreadline, etc.) should
  appear; superseded items should drop.
- **Scattered deferred items** — collapse into the Future improvements
  section (see previous subsection).
- **Cross-link rot** — links from `system-design.md` § Open
  questions to `AGENT.md` should still point at the right anchor.
- **Per-persona memory** — sections that no longer apply (e.g. a
  process note from a project that closed) — move them out or
  archive. Don't delete useful-but-quiet notes; the memory file is
  allowed to grow as long as it stays *high-signal*.

Triggers that justify a cleanup:
- A milestone hit (v1 → v1.1 → v1.2 …).
- The user explicitly asks for one.
- The file has grown past ~200 lines and the achievement log is
  longer than the rest of the content combined.

---

## Style

Programming-style defaults I bring to any new project. Per-project
deviations go in the project's `AGENT.md` (or in module briefs).
Items below are defaults unless explicitly overridden.

### C++ / systems
- **C++20 by default** for new C++ work; older codebases stay on
  their existing standard.
- **`-Wall -Wextra` minimum warning level.** Treat new warnings
  as errors-in-the-making; don't ship them. Add `-Werror` once
  the build is warning-clean.
- **No naked `new` / `delete`.** RAII wrappers everywhere; if a
  C-style handle (ODBC `SQLHANDLE`, file descriptor, …) leaks,
  wrap it in a class with a silent destructor.
- **Headers self-contained on standard library + project headers
  only.** Third-party includes live in `.cpp` files unless the
  header genuinely needs the third-party type in its interface.
- **Forward-declare in `.hpp`, full include in `.cpp`.** Keeps
  the include graph clean and reduces compile times for
  downstream modules. Multi-class modules pair a single
  `<name>.hpp` + `<name>.cpp`.
- **No exceptions across module boundaries.** Each module catches
  its own failures and surfaces them via return values, error
  states, or local callbacks. The entry-point layer is the only
  place that turns module-level errors into user-visible output
  (and a non-zero exit code).
- **No module-level globals, no hidden state.** Function-internal
  `static` helpers (e.g. a `static bool` banner-once flag) are
  fine. Anything that ships across function calls should live
  in an explicit struct / class passed to the function.
- **`std::cout` for program output, `std::cerr` for errors.** Never
  mix them. Pipes / redirects work correctly when you do.
- **Readability over cleverness.** No premature optimisation; a
  one-line obvious solution beats a five-line clever one.

### Build / packaging
- **CMake for new C/C++ projects.** Modern CMake (≥ 3.20) with
  `target_*` commands; avoid global `include_directories` /
  `add_compile_options`. Use imported targets produced by
  `find_package` (`ODBC::ODBC`, `Readline::Readline`), not
  hand-rolled `${LIB}_INCLUDE_DIRS` / `${LIB}_LIBRARIES`.
- **No `file(GLOB)`.** List sources explicitly. Lets readers see
  the entire executable in one place and keeps the build
  deterministic.
- **Vendored single-header libraries live under `third_party/`**;
  one shared `third_party/README.md` carries provenance (version
  + date) for the lot; never a separate README per lib.
- **`find_package(...)` is preferred.** Required dependencies
  fail the configure; optional dependencies fall through to a
  fallback path with a configure-time warning (not a build
  error).
- **No install targets, no tests, no packages** unless the user
  asks. POC work doesn't need them; the moment they're useful,
  the user will say so.

### Documentation
- **Per-module spec shape**: purpose / public surface / behaviour
  / error semantics / dependencies / notes for implementers. One
  doc per planned `src/<name>.cpp`.
- **Implementation briefs mirror the spec shape** but talk to the
  implementer: where the code goes, what to read first, what to
  implement, smoke-test recipe, conventions, deliverable
  checklist.
- **Achievement-log entries are dated + tiny summaries + named
  next steps.** Full details stay in the matching `*.md`; the
  log is chronology, not the place to be re-reading entire
  modules from.
- **Cross-link don't copy.** When something is documented
  elsewhere (`system-design.md`, a per-module spec), the
  reaching-out doc references the path rather than duplicating
  the content.

### CLI / REPL / shell-style programs (low-level note)

- **`build/run`** commands listed in `AGENT.md` in short form,
  pointing at the long form in `system-design.md`. Don't write
  the long form in `AGENT.md`.
- **The entry point is the only place that maps exceptions to
  exit codes.** Choose exit-code conventions per project
  (sqlcpp: ODBC → 1, std::runtime_error → 2, other → 3,
  CLI11 → its own code); pin them in the brief and keep the
  table forward-compatible with future wrappers.
- **Smoke tests in layers.** Layer 1 = no external dependencies
  (`--help`, piped stdin, fakes). Layer 2 = real backend (SQL
  Server etc.). Layer 3 = interactive / TTY-only paths
  (documented, sometimes skipped). Layer 1 is mandatory; later
  layers can be deferred when the dependency isn't available.

