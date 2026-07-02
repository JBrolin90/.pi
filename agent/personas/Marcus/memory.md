# Marcus — Memory

## Process

### Documentation Standard — Per-Module Implementation Description

For every C/C++/etc. module I implement, ship a per-module
implementation description markdown file **next to the implementation,
not at the project root**, following this fixed 10-section layout.
Established in the `sqlcpp` project (2026-06); applies to any future
project that uses a module-style file layout. File path:
`src/<name>.md` (same directory as the `.cpp`).

**The cardinal rule (added 2026-07-02): code carries no comments,
the `<name>.md` carries all of them.** Every module ships as a
**three-file triplet with the same basename and three different
extensions: `<name>.hpp`, `<name>.cpp`, `<name>.md`**. The
`.hpp`/`.cpp` contain code only — no `//` or `/* */` comments, no
API docstrings, no inline section markers, no `TODO` notes, no
license headers. Every piece of documentation that used to live
inline in the code (API contract on declarations, "why this code
looks like this" rationale on statements, navigational section
markers, `TODO` notes) is **moved into the `<name>.md`**. The
`.md` is the canonical documentation surface; the code is the
canonical behaviour. When the two disagree, the code wins, but
the `.md` must be brought into agreement in the same commit.

**Why this rule exists.** Before 2026-07-02 the inline comments
in `.cpp`/`.hpp` and the rationale in `<name>.md` were
duplicating each other (e.g. `result_set.cpp`'s codecvt
deprecation note was repeated verbatim in `result_set.md` § 4.2).
The duplication was a maintenance burden: any change to the
rationale had to be made in two places, and the two would drift.
Consolidating into the `.md` makes the `.md` single-source-of-
truth for "why" and the code single-source-of-truth for "what".

**Stale-comment mitigation.** Because comments are no longer next
to the code, they can drift silently when the code is edited.
The mitigation is a discipline rule, not a tool:

- **Every code change ships with a `.md` update in the same
  commit** when the change affects rationale, defaults,
  error-handling behaviour, or contracts. Mechanical changes
  (whitespace, naming) do not require a `.md` update.
- **When reviewing a `.cpp`/`.hpp` diff, also review the
  matching `<name>.md`** for staleness. The `.md` is treated as
  load-bearing as the code itself.
- If a future reader finds code that disagrees with the `.md`,
  the code wins — but the discrepancy is fixed by updating the
  `.md`, never by adding an inline comment to the code.

**The 10 sections, in order:**

1. **Scope and responsibilities** — what the module does + an
   explicit "non-responsibilities" list (what it deliberately does
   NOT do, per the spec). The non-responsibilities list is where
   future-me learns the design's boundaries; never omit it.
2. **Files** — table of every file the module owns (header, source,
   vendored deps). Flag explicitly when there are no vendored
   deps. Note the triplet layout (`<name>.hpp`/`<name>.cpp`/
   `<name>.md`) explicitly so future-me remembers that the
   documentation lives next to the code, not in a separate docs
   tree.
3. **Public API** — the **bare** declarations (no comments) in a
   code block, followed by prose describing the non-obvious
   choices (defaults, intentional omissions, naming). Whatever
   was previously a docstring or a comment on a declaration
   moves into this prose. Don't restate the contract; link to
   the spec.
4. **Implementation walkthrough** — prose walkthrough of the
   implementation, organised by function or by logical step.
   For each non-obvious decision, say *why*, not just *what*.
   Don't narrate line-by-line; only surprise-worthy choices.
   Whatever was previously an inline comment in the `.cpp`
   (rationale, "this is the X case", section markers like
   `// 1. Column count.`) moves into a numbered subsection
   here. Code snippets may appear where prose is insufficient.
5. **Error handling** — every error path: who throws what, the
   exception type, the literal message format quoted, and how
   the caller surfaces it.
6. **Header hygiene + Dependencies** — the literal include list
   (header includes X, header does NOT include Y) and a dependency
   table (where, why). Together these are the cross-module
   dependency contract; load-bearing for the build graph.
7. **Verification** — exact build command, exact smoke-test recipe,
   expected output (or eyeball-check criteria when byte-comparison
   is platform-fragile), and confirmation that all scratch files
   were deleted.
8. **Coding conventions** — which local style rules the code
   follows, cross-referencing the project's conventions doc. This
   is where deviations from the spec get justified.
9. **Known issues** — caveats, deprecations, edge cases a future
   reader will hit. If a vendor library is deprecated and we
   silenced the warning locally, this is where that lands. Any
   `TODO` that used to live as an inline comment in the `.cpp`
   (e.g. `TODO(utf8cpp)`) is recorded here with its full
   rationale.
10. **Where to read next** — links to the spec, the task brief,
    sibling modules, the system design, and the next module to
    build.

(Original was 11 sections; 6 and 7 merged into one combined
section because they're the same concern — what the module
includes and where.)

**Style:**
- Describes the code that was written, not the contract. The spec
  lives elsewhere; the per-module doc complements it. Link out
  for the "what", explain the "why" inline.
- One short intro paragraph (before section 1) names the doc, the
  module, the spec it complements, and what this doc focuses on.
  Don't summarise the whole module here.
- Readable > clever. ASCII bullets. Prose over tables when prose
  is clearer. Code blocks for the bare public API (§ 3) and for
  non-obvious implementation snippets (§ 4). Cross-references
  are full relative paths so they survive the file being moved.
- Every shipped module has one. If a module ships without one,
  write it retroactively to keep the layout consistent.
- The companion task brief
  (`src/<name>{_,-}implementation_instruction{s,}.md`) is read
  *before* writing any code and is cited in § 10. Once the module
  ships, the brief, the `.cpp`, the `.hpp`, and the `.md` all sit
  side by side in the same directory.
- **Never duplicate rationale between the `.md` and the
  `.cpp`/`.hpp`.** If a piece of "why" lives in the `.md` § 4,
  it does not appear in the `.cpp`. The `.cpp` is allowed to
  look sparse — that's the point.

**Anti-patterns:**
- **Any comment in `.cpp` or `.hpp`.** This includes API
  docstrings (`/** ... */`), section markers (`// 1. Column
  count.`), inline rationale (`// SQLWCHAR is 2 bytes on Linux
  because ...`), trailing `// end of function` markers, and
  license headers. All of it goes in the `.md` instead.
  License headers, if needed, belong in a separate
  `LICENSE*` file at the project root, not in each `.hpp`.
- Description at the project root or work-area root (it belongs
  next to the `.cpp`).
- Duplicating the contract in the description. If the spec says
  "the function throws on X", the description says "this is
  implemented by Y; see the spec for the full error contract".
- Omitting the "non-responsibilities" subsection in § 1. A
  description without it reads as advertising, not engineering.
- Listing dependencies that aren't used (or omitting ones that
  are). The table in § 6/7 is the source of truth.
- Adding a "see inline comment in X.cpp" cross-reference in the
  `.md` — there are no inline comments in the `.cpp` to point
  at.

**Reference:** `sqlcpp`'s `src/result_set.md` (2026-07-02,
post-migration) follows this layout 1:1 and is a good template
for a small, pure module. Larger modules (e.g.
`src/odbc_statement.md`) keep the same 10 headings but expand
§ 4 (Implementation walkthrough) with one numbered subsection
per former inline section marker (e.g. § 4.1 Column count step,
§ 4.2 Column metadata step, § 4.3 Cell buffer init, § 4.4 Row
loop, § 4.5 Progressive read).

### Brief vs. reality — documenting deviations

When a task brief turns out to be wrong on a specific point —
usually because the brief was written for a hypothetical
environment and the real end-to-end test surfaces different
behaviour — the implementation must:

1. **Trust the code, not the brief.** The real behaviour wins.
   The fix goes in the `.cpp` (code only — no inline comment
   pointing back to the brief; the `.cpp` carries no comments at
   all per the cardinal rule above). The explanation of *why the
   fix deviates from the brief* lives in the `.md`.
2. **Document the deviation in the per-module `.md`** as a
   numbered list in a "deviations from the brief" subsection,
   with each item stating: (a) what the brief said, (b) what
   reality says, (c) why reality wins. The
   `sqlcpp/odbc_statement.md` § 4.7 list is the canonical
   example.
3. **Don't apply the brief's wrong recipe in any future
   implementation.** Future work in the same family should
   follow the proven pattern, not the brief's original recipe.
4. **Flag the spec / brief typo for the design agent.** That's
   not the implementation's job. The `.md` documents the gap;
   the AGENT.md achievement log entry references it.

The "trust the code" rule applies even to the brief's smoke-test
recipe: if the brief's three smoke tests don't catch the
deviation (because the brief's recipe is for a different
environment), end-to-end test against a real driver. The brief
is a starting point, not the contract.

## Coding Style

- **C++ variables: always camelCase.** Applies to locals,
  parameters, members, globals. No snake_case.
- **Design principles, always:** **Separation of Concerns** (one
  concern per unit), **DRY** (extract shared behavior into a
  named abstraction, never copy-paste), **Single Responsibility
  Principle** (one reason to change per unit; if it can be
  described with "and", split it).
- **No premature optimisation.** Don't add complexity for
  hypothetical future requirements. Measure before optimising.
  Project-specific concrete advice (e.g. `operator+=` over
  `ostringstream`) belongs in each project's AGENT.md, not here.
- **Forward-declare heavy types in headers, include them in
  `.cpp`.** A header that mentions a type only by reference /
  pointer / `unique_ptr` should forward-declare it; the full
  `#include` lives in the implementation. Exception:
  `unique_ptr<T>` with an incomplete `T` is allowed in
  declarations, but the `unique_ptr` user's `.cpp` must include
  `T`'s header for the destructor. ("Include what you use"
  applies transitively to the `.cpp`, not the header.)
- **Catch at the outermost scope.** Short programs / CLIs: one
  outer `try` with three `catch` arms by exception category
  (project-specific error type → `1`, `std::runtime_error` → `2`,
  other `std::exception` → `3`); no inner `try` blocks; happy
  path reads top-to-bottom. REPLs and long-running loops: the
  loop wraps every call site in `try / catch (const
  std::exception&)` so a single bad input never kills the
  session. See `sqlcpp/interactive_mode.cpp` for the canonical
  REPL example.
- **No comments in `.cpp` or `.hpp`.** Cardinal rule of the
  documentation standard (above). If a comment feels necessary,
  it goes in `<name>.md` instead. The only acceptable "comment"
  in code is the `// namespace sqlcpp` close marker, and even
  that is purely a grep helper, not documentation.

## People