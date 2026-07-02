# Marcus — Memory

## Personal

## Voice

## Process

## Coding Style

- **C++ variables: always camelCase.** User explicitly requested this convention.
  Applies to local variables, function parameters, member variables, and globals
  in any C++ code I write or edit. Do not use snake_case for C++ variables.
- **Design principles to always honor** when implementing classes, functions,
  and modules:
  - **Separation of Concerns** — each unit handles one distinct concern; keep
    unrelated responsibilities apart.
  - **DRY (Don't Repeat Yourself)** — no duplicated logic; extract shared
    behavior into a single, named abstraction instead of copy-pasting.
  - **Single Responsibility Principle (SRP)** — every class/module/function
    has one reason to change; if it can be described with "and", split it.

## Documentation Standard — Per-Module Implementation Description

For every C/C++/etc. module I implement, ship a per-module implementation
description markdown file that lives **next to the implementation, not at
the project root**, following a fixed 11-section layout. This standard
was established by the `sqlcpp` project (2026-06 onwards) and applies
to any future project that uses a module-style file layout.

**Layout.** The file lives at `src/<name>.md` (or the project's equivalent
for `.cpp` files — same directory as the `.cpp`, same basename). Exactly
these sections, in this order:

1. **Scope and responsibilities** — what the module does, plus an
   explicit "non-responsibilities" list (what it deliberately does NOT
   do, per the spec). Both halves matter: the non-responsibilities list
   is where future-you learns the design's boundaries.
2. **Files** — a table of every file the module owns (header, source,
   vendored deps). Say which deps are in `third_party/`, if any, and
   why; flag explicitly when there are **no** vendored deps.
3. **Public API** — the literal declarations from the header, in a
   code block, with a short prose commentary on the *non-obvious*
   choices (defaults, intentional omissions, naming). Don't restate
   the contract — link out to the spec.
4. **Implementation walkthrough** — the actual code, with a numbered
   list of the non-obvious decisions. Don't narrate line-by-line;
   cover only the choices that would surprise a reviewer. For each,
   say *why*, not just *what*.
5. **Error handling** — every error path: who throws what, the
   exception type, the message format (with the literal message
   quoted), and how the caller is expected to surface it.
6. **Header hygiene** — the literal include list, split into
   "header includes X" and "header does NOT include Y" with reasons.
   This is the cross-module dependency contract; treat it as
   load-bearing for the build graph.
7. **Dependencies** — a table: dependency, where it's used (header
   vs source), why. A reader should be able to reconstruct the
   dependency graph from this table alone.
8. **Verification** — exact build command (`g++ -std=c...` or
   equivalent), exact smoke-test recipe, expected output (or
   eyeball-check criteria if byte-comparison is platform-fragile),
   and confirmation that all scratch files were deleted.
9. **Coding conventions** — which local style rules the code follows
   (naming, namespace close-comment, member-init patterns, etc.),
   cross-referencing the project's conventions doc. This is where
   *deviations from the spec* get justified (e.g. "the spec said
   `display_width` but the project's C++ style is camelCase members,
   so the field is `displayWidth`").
10. **Known issues** — caveats, deprecations, edge cases that
    a future reader will hit. If a vendor library is deprecated
    and we silenced the warning locally, this is where that lands
    (plus the `TODO` next to the silenced lines).
11. **Where to read next** — links to the spec, the task brief,
    sibling modules, the system design, and the *next* module to
    build.

**Conventions that apply across all 11 sections:**

- **Describes the code that was written, not the contract.** The
  contract/spec lives at `docs/<name>.md` (or equivalent). The
  per-module description complements the spec by focusing on
  implementation choices and their rationale. Link out for the
  "what", explain the "why" inline.
- **The companion task brief** from the upstream design agent
  (e.g. `src/<name>_implementation_instruction.md` or
  `src/<name>-implementation-instructions.md`) is read **before**
  writing any code and is cited in § 11. Once the module ships,
  the brief, the `.cpp`, and the `.md` description all sit side
  by side in `src/`.
- **Every shipped module has one.** If a module is shipped
  without a description, the description is written retroactively
  to keep the layout consistent — same way Claudia wrote the
  brief for `odbc_connection` retroactively in `sqlcpp`.
- **Intro paragraph** (before section 1) names the doc, the
  module, the spec it complements, and what this doc focuses on.
  One short paragraph; do not summarise the whole module here.
- **Style:** readable > clever. ASCII bullets, prose over tables
  when prose is clearer, code blocks for the public API and the
  non-obvious implementation snippets.
- **Cross-references** are full relative paths so they survive
  the file being moved: `../system_agent/docs/<name>.md`, not
  bare `docs/<name>.md`.

**Anti-patterns to avoid:**

- Don't put the description at the project root or work-area
  root — it belongs next to the `.cpp`. (This was the original
  mistake in `sqlcpp`; the briefs had to be relocated into
  `src/` retroactively.)
- Don't duplicate the contract in the description. If the spec
  says "the function throws on X", the description says "this
  is implemented by Y; see the spec for the full error contract".
- Don't omit the "non-responsibilities" subsection in § 1.
  A description without it reads as advertising, not engineering.
- Don't list dependencies that aren't used (or omit ones that
  are). The table in § 7 is the source of truth.

**Reference example:** `sqlcpp`'s `src/result_set.md` (2026-07-02)
follows this layout 1:1 and is a good template for a small,
pure module. Larger modules (e.g. `src/odbc_connection.md`) keep
the same 11 headings but expand § 4 (Implementation walkthrough)
with multiple subsections.

## People