# `persona-loader.ts` — Implementation Description

This document describes the implementation choices in `persona-loader.ts`,
a TypeScript extension for the pi coding agent. It complements the contract
in `extensions/persona-loader/README.md`, which is the user-facing spec;
this file focuses on the "why" of the code, not the "what".

---

## 1. Scope and responsibilities

The module is a global pi extension that exposes a single slash command,
`/become-persona [name]`, and uses two pi lifecycle hooks to splice a
persona's markdown bundle onto the next system prompt. Concretely it:

- Discovers available personas by listing subdirectories of
  `~/.pi/agent/personas/`.
- Reads up to four sources per persona on demand: `common.md` (shared,
  persona-agnostic), `<name>/persona.md` (role), `<name>/memory.md`
  (cross-project working notes), and the per-project tier at
  `<cwd>/.personas/<name>/*.md` (auto-created on first adopt in a given
  working directory; the helper also `writeFileSync`s an empty
  `project.md` there). All `*.md` files in the per-project dir are read,
  sorted alphabetically, on every `/become-persona`.
- Prepends an `# Active Persona: <Name>` banner at the very top of the
  persona prompt and appends a closing `# Active Persona Confirmation`
  block at the very bottom (after the Memory Guidelines footer). The
  opening banner focuses on the *name* (`**You are <Name>** ...
  superseding any prior persona identity`); the closing confirmation
  focuses on the *behaviour frame* (`your role, behaviour, and accepted
  task scope are defined by your current persona`). Together they
  suppress the two halves of the conversation-history pattern-match the
  model builds in long sessions — first the prior persona's identity
  claims leak through ("Who are you?" → prior name), then the prior
  persona's behaviour patterns (refusing out-of-character tasks after
  the switch). Both banners are sourced from the `personaName` argument,
  not from disk. See § 4 step 5, § 5 row 2, § 10 row 6.
- Injects **no per-source section/provenance headers**. The four sources
  (`common.md`, `persona.md`, `memory.md`, the per-project tier) are
  concatenated verbatim and each is expected to carry its own top-level
  heading; the loader adds only the opening identity banner, the Memory
  Guidelines footer, and the closing identity confirmation. Rationale:
  the loader injects *pure instructions for the loaded persona*, not
  meta-commentary about where content came from — a header like `# Shared
  Persona Guidelines (common.md)` informed the model "these apply to
  every persona" (the same class of informing as the old `Applies to
  all personas` H1 that was removed from `common.md`). See § 4 step 3
  and § 10 row 8.
- Appends a "Memory Guidelines" footer pointing the agent at three
  paths — `<name>/memory.md` (cross-project),
  `<cwd>/.personas/<name>/project.md` (per-project), and `<cwd>/AGENT.md`
  (shared spec) — with a tier-routing rule for which kind of fact goes
  where and a prohibition on achievement-log bookkeeping (git history is
  canonical).
- Registers tab-completion against the discovered persona names, with each
  item carrying the persona's `## Title:` line in its `description` field
  so the dropdown renders `name — title` rows. Also registers a custom
  autocomplete provider on `session_start` so Tab on `/become-persona `
  fires the persona dropdown immediately rather than routing to file
  completion.
- On `before_agent_start`, returns a `systemPrompt` composed of pi's
  existing prompt plus the staged persona content. The staged content is
  never cleared during the session, so the persona is reapplied on every
  subsequent turn until either another `/become-persona` swaps it or the
  extension is reloaded.
- Shows the active persona in the TUI footer as `👤 <name> — <title>`
  (e.g. `👤 Maya — Loader Engineer`) when `<name>/persona.md` carries a
  `## Title:` line, falling back to `👤 <name>` when the line is missing
  or unreadable. Wired via `ctx.ui.setStatus("persona", ...)` whenever a
  UI context is available (gated on `ctx.hasUI`). The status row has the
  same lifetime as the staged prompt — it appears on `/become-persona`,
  swaps with the next `/become-persona`, and disappears on `/reload`.

### Non-responsibilities

The module deliberately does **not**:

- Replace or rewrite pi's existing system prompt — it only appends.
- Validate, lint, or parse the markdown contents; it treats them as opaque text.
- Edit any persona file itself (writing to disk is the agent's job).
- Expose a command to *clear* the active persona mid-session. To drop
  it, swap with `/become-persona <other>`, run `/reload`, or end the
  session.
- Ship with personas; the personas directory is user-managed.
- Apply the persona retroactively to a turn that has already started — the
  prompt injection only takes effect on the next `before_agent_start`.

---

## 2. Files

| Path | Role |
| --- | --- |
| `extensions/persona-loader.ts` | The extension. Loaded by pi's jiti-based extension loader. |
| `extensions/persona-loader/README.md` | The contract/spec — installation, directory layout, command semantics. |

There are **no vendored dependencies**. The only runtime imports are
Node.js core modules (`node:fs`, `node:os`, `node:path`) and the
`ExtensionAPI` type from the pi package itself. No `package.json`,
`node_modules`, build artifacts, or generated files belong to this module.

---

## 3. Public API

The module exports exactly one symbol.

```ts
export default function (pi: ExtensionAPI): void
```

`pi` is pi's extension host. The default export is invoked once when pi
loads the extension; it registers one command and two event hooks and returns
nothing. Everything else in the file is module-private.

### Non-obvious choices

- **No named exports.** Pi's extension loader looks for `default`; naming
  it would be misleading and there is no consumer outside the loader.
- **`import type { ExtensionAPI }`** rather than a value import — `ExtensionAPI`
  is type-only and value-importing it would either fail at runtime (if it's
  erased) or pull a transitive path under `node_modules` for no benefit.
- **`node:` protocol** on every Node core import (`node:fs`, `node:os`,
  `node:path`) instead of the legacy bare-name forms — makes it unambiguous
  to readers and bundlers that these are built-ins, and avoids the
  `node/no-missing-import`-style warning that some lint setups emit for the
  bare form.

---

## 4. Implementation walkthrough

The non-obvious decisions, in order of appearance.

1. **Module-level mutable state for `pendingPersonaPrompt`.** The command
   handler and `before_agent_start` are separated by an event boundary — the
   handler cannot return its value to the hook. Storing the staged prompt
   in module scope is the smallest possible glue between the two events,
   and letting it survive across turns gives the persona a session-long
   lifetime without further work. The alternative (passing state through
   `ctx` or an external store) would exceed what the extensions API offers.

   *Caveat:* module-level state does **not** survive a `jiti` reload. After
   `/reload` the prompt must be re-applied with another `/become-persona`
   call. This is documented under § 10.

2. **`try` boundaries.**
   - `loadPersonaContent`'s common/persona/memory reads are wrapped in
     one outer `try` (not per file) because a single failure (e.g.
     permission denied on `common.md`) would otherwise leak partial
     output to the system prompt; the block returns the empty string so
     the handler surfaces one consistent "not found" message.
   - `loadProjectPersonaMemory` deliberately has its own two try blocks
     — one around `mkdirSync`/`writeFileSync` (init) and one around
     `readdirSync`/`readFileSync` (read) — because the two failure modes
     are semantically distinct. Init failure → empty per-project tier;
     persona still loads from the other tiers. Read failure → log and
     return whatever was read so far; does not propagate to the outer
     try.

3. **Strict concatenation order.** Identity assertion (loader-prepended
   in `loadPersonaContent`, see step 5) → `common.md` → persona profile
   → persona memory → per-project tier (`<cwd>/.personas/<name>/*.md`,
   sorted alphabetically) → Memory Guidelines footer → Identity
   confirmation (closing reminder, loader-appended, see step 5). The
   loader injects **no per-source section headers**: each source file is
   concatenated verbatim and is expected to carry its own top-level
   heading (`persona.md` and `memory.md` do; `common.md` is intentionally
   headingless — see § 10 row 8). The only loader-injected headings are
   the opening `# Active Persona:` banner, the `# Memory Guidelines`
   footer, and the closing `# Active Persona Confirmation` block. The
   opening assertion is the first content the model sees inside the
   persona append, before any `common.md` text, so the new identity is
   established before the role definition and the shared guidelines.
   The closing confirmation is the very last persona-flavoured content
   before the model begins generating, so it lands on top of
   conversation-history pattern-match weight from the prior persona.
   The Memory Guidelines footer rides inside `loadPersonaContent` (not
   the hook) so it is identical regardless of which hook fires; the
   closing confirmation rides the same path for the same reason.

4. **Per-project tier helper** (`loadProjectPersonaMemory`). The
   helper encapsulates everything outside the three global files:
   `mkdirSync({recursive: true})` of `<cwd>/.personas/<name>/` plus
   a one-time `writeFileSync` of an empty `project.md` on first adopt,
   then a sorted `readdirSync`/`readFileSync` of every `*.md` in that
   directory. The `created: boolean` returned alongside
   `content: string` lets the command handler trigger the one-time
   `Initialised project memory at .personas/<name>/` toast without an
   additional filesystem probe. The helper has its own two try blocks;
   see step 2 for why it deliberately is *not* folded into the outer
   try in `loadPersonaContent`.

5. **Identity assertion prepended at the top.** The loader prepends a
   `# Active Persona: <personaName>` banner at the very start of
   `extraPrompt`, before any disk read happens and before any other
   content is appended. The banner carries an explicit `**You are
   <personaName>** ... superseding any prior persona identity
   established through earlier conversation in this session` line so
   the model reads "I am <Name>" as the first persona-flavored content
   in its system prompt. This counters conversation-history
   pattern-match in long sessions — the loader cannot fully suppress
   this with disk-only changes (the model sees the entire conversation
   thread including prior "I am Y" answers to "Who are you?"), so the
   assertion makes the freshly-staged identity salient. The banner is
   unconditional: it ships on every successful `/become-persona`
   regardless of which sources are present, and is discarded only when
   the function returns the empty `""` (see step 6).

6. **Empty string on missing `persona.md`.** If `persona.md` is absent
   the function logs a `console.warn` and returns `""` *immediately*, even
   if `memory.md` exists. A persona without a role definition is not a
   persona; silently keeping the memory would mask the misconfiguration.
   The handler treats `""` as "not found" and notifies accordingly.

7. **`personaName.replace(/['"`]/g, "")`** defensively strips wrapping
   quotes. The slash-command parser sometimes preserves literal quotes from
   the input line, and a typo like `/become-persona 'Marcus '` should not
   fail just because the user fat-fingered a quote.

8. **Tab-completion is a case-insensitive prefix match against
   `listPersonas()`**, returning `null` (not `[]`) when nothing matches.
   Per the extension API contract, `null` lets pi fall back to its own
   completion, which is the correct behaviour when no persona starts with
   the prefix the user has typed. Each item's `description` carries the
   persona's `## Title:` line (via `listPersonaCompletions`, step 10),
   so the dropdown renders `name — title` rows.

9. **`return { systemPrompt: event.systemPrompt + pendingPersonaPrompt }`.**
   Returning the whole prompt — not a delta — is required by the hook's
   contract; pi replaces its own systemPrompt with whatever object is
   returned. The order (existing first, persona second) matches the README
   spec and is deliberate: appending after pi's own preamble keeps
   pi-managed content authoritative.

10. **`listPersonaCompletions(prefix)` helper.** Reads every persona's
    `## Title:` line in one pass via `loadPersonaTitle` (step 13) and
    returns a list of `{ value, label, description? }` items ready for
    pi's autocomplete API. Used by both `getArgumentCompletions` (the
    natural-trigger path that fires when the user types a letter after
    `/become-persona `) and the custom provider registered in step 11
    (the Tab path that fires immediately). Keeping both paths routed
    through one helper guarantees the dropdown looks identical regardless
    of how it was triggered.

11. **Custom autocomplete provider for Tab-immediate persona list.**
    Pi's built-in `CombinedAutocompleteProvider.handleTabCompletion`
    routes Tab on slash-command-with-arg to file completion, not the
    command's `getArgumentCompletions`. To make Tab on `/become-persona `
    show the persona dropdown immediately, the loader registers a
    wrapper provider via `ctx.ui.addAutocompleteProvider` on
    `session_start`. The wrapper detects `/become-persona<ws><arg?>`
    patterns with a single anchored regex, returns
    `listPersonaCompletions(argPrefix)` items, and otherwise delegates
    to the built-in via `current.getSuggestions(...)` so non-persona
    slash commands and file paths are unaffected. `applyCompletion`
    delegates too — the built-in's text-replacement logic is correct
    for the persona case (replace prefix with persona name).

    **`shouldTriggerFileCompletion` override (tab gating).**
    The wrapper also overrides `shouldTriggerFileCompletion` for the
    `/become-persona<ws>` pattern. The built-in's impl in
    `@earendil-works/pi-tui` checks
    `textBeforeCursor.trim().includes(" ")` — the `.trim()` strips the
    trailing space after a slash command, so `/become-persona `
    looks like `/become-persona` (no space) and the built-in returns
    `false`. The editor's `requestAutocomplete` then returns early
    without firing the autocomplete request, and Tab on
    `/become-persona ` shows nothing. We match the un-trimmed text
    (`/^\/become-persona[ \t]/`) and return `true` so the request
    fires; `getSuggestions` above then produces the persona dropdown.
    Scoped to our command so other slash commands with spaces
    continue to fall through to the built-in's (currently buggy)
    logic. The override is the smallest change that closes the
    loop: without it the `getSuggestions` rewrite never runs on
    the initial Tab path. (Note that the natural-trigger path — typing
    a letter — works without the override because
    `requestAutocomplete` only consults `shouldTriggerFileCompletion`
    when `options.force === true`; natural triggers pass `force=false`.)

12. **Status row via `ctx.ui.setStatus`.** The loader owns one footer
    slot keyed `"persona"`. On every successful `/become-persona` the
    loader calls `ctx.ui.setStatus("persona", "👤 <name> — <title>")`
    *iff* `ctx.hasUI` is true, so the footer is visible in TUI and RPC
    modes but silently skipped in print/JSON modes. The Title is read
    from `<name>/persona.md`'s `## Title:` line via the `loadPersonaTitle`
    helper (step 13); when that line is missing or the file is unreadable,
    the format falls back to `👤 <name>`. The slot is never cleared by
    the loader; it disappears implicitly when the extension instance is
    torn down (`/reload`, end of session) because the framework releases
    the key with the instance. Other extensions wanting to extend the
    footer should pick a different key.

13. **`loadPersonaTitle` helper.** Reads `<name>/persona.md` once, runs
    a single anchored regex (`/^## Title:\s*(.+?)\s*$/m`) to extract the
    `## Title:` line, and returns the trimmed title text — or `""` if
    the file is absent, unreadable, or has no Title line. The helper
    deliberately does *not* fold into `loadPersonaContent`: the Title
    is metadata for the status row, not prompt content, and keeping the
    two reads separate means a future change to the prompt-concatenation
    order doesn't accidentally affect the status row.

---

## 5. Error handling

| Failure mode | Where | Behaviour |
| --- | --- | --- |
| `common.md` missing | `loadPersonaContent` | Silently skipped. The persona-specific content is still loaded. |
| `<name>/persona.md` missing | `loadPersonaContent` | Logs `[persona-loader] persona.md not found for "<name>"` via `console.warn`, returns `""`. Memory is also discarded. |
| `<name>/memory.md` missing | `loadPersonaContent` | Silently skipped. |
| Filesystem read error (permissions, ENOENT during race, etc.) | `loadPersonaContent` | Caught at the outer `try`, logged as `[persona-loader] failed to load persona files: <err>`, returns `""`. |
| `<cwd>/.personas/<name>/` cannot be created (`mkdirSync` fails or `writeFileSync` fails) | `loadProjectPersonaMemory` (init try) | Logs `[persona-loader] failed to initialise project memory for "<name>": <err>`, returns `""`. The cross-project persona still loads. |
| `<cwd>/.personas/<name>/*.md` unreadable after init | `loadProjectPersonaMemory` (read try) | Logs `[persona-loader] failed to read project memory for "<name>": <err>`, returns whatever was read so far (or `""`). Does not propagate to the outer try; the persona is still applied. |
| Unknown persona name | handler | `ctx.ui.notify('Persona "<name>" not found', 'error')` and returns. |
| No argument provided to `/become-persona` | handler | Lists available personas via `ctx.ui.notify`, returns. |
| `~/.pi/agent/personas/` unreadable | `listPersonas` | Returns `[]`; downstream the user sees an empty persona list. |
| `personaName` is a non-empty string but produces an empty prompt (e.g. trailing whitespace, quotes left after a malformed stripping) | `loadPersonaContent` | Returns `""`; handler notifies `Persona "<name>" not found`. The identity assertion is also discarded in this case (it lives in `extraPrompt`, which the empty-prompt return path throws away). |
| The model answers as a prior persona after a switch | Runtime (model-side) | Not a loader failure. See `## Known issues` row 6 (identity-assertion mitigates but does not fully eliminate the conversation-history pattern-match path). |

Diagnostics from `loadPersonaContent` go to `console.error` / `console.warn`
rather than `ctx.ui.notify` because they can fire before the UI handler runs
(in the `before_agent_start` path) and because they're expected to be rare
configuration problems, not user-facing events.

---

## 6. Import hygiene

The header's full import list:

- `import type { BeforeAgentStartEvent, ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";`
- `import * as fs from "node:fs";`
- `import * as os from "node:os";`
- `import * as path from "node:path";`

The header does **not** import:

- Any persona-specific module. Persona discovery is filesystem-based, not
  code-based — there is no coupling between this extension and the contents
  of any persona directory.
- Any logging facade. `console.*` is used directly; introducing a logger
  would expand the surface for no functional gain.
- Any markdown parser. Persona content is treated as opaque text.

---

## 7. Dependencies

| Dependency | Used in | Why |
| --- | --- | --- |
| `@earendil-works/pi-coding-agent` (type-only) | Header | `ExtensionAPI` type for the default-export signature. No runtime value import. |
| `node:fs` | Source | `existsSync`, `readFileSync`, `readdirSync` for persona + memory reads; `mkdirSync({recursive: true})` + `writeFileSync` for the per-project tier init (writes only to `<cwd>/.personas/<persona>/project.md`; see the row below). |
| `node:os` | Source | `homedir()` to resolve `~/.pi/agent/personas/`. |
| `node:path` | Source | `path.join` for persona + memory file paths, and `path.join(process.cwd(), ".personas", …)` for the per-project tier. |
| `<cwd>/.personas/<persona>/project.md` | `loadProjectPersonaMemory` (init) | Writable surface. Auto-created (empty) on first `/become-persona <persona>` in a given working directory via `mkdirSync({recursive: true})` + `writeFileSync("")`. The loader is the sole writer and only writes the empty initial file — it never amends or overwrites. Subsequent reads come from this same path (and from any sibling `*.md` files). |

There are no transitive runtime dependencies. The pi package itself is a
peer dependency of the agent, not of this extension.

---

## 8. Verification

There is no automated test suite for this module; verification is manual
and follows the smoke-test recipe in `extensions/persona-loader/README.md`.

**Manual smoke test:**

1. Ensure at least one persona exists, e.g.
   `~/.pi/agent/personas/Marcus/persona.md` (and optionally `memory.md`).
2. Ensure `~/.pi/agent/personas/common.md` exists, or accept that the
   loader will skip it silently.
3. Restart pi (or `/reload`) so the loader is picked up.
4. Run `/become-persona Marcus` — the toast should read
   `Switched to persona: Marcus`. The TUI footer should now show
   `👤 Marcus — Implementation Engineer`.
5. Tab on `/become-persona ` (slash command, name, then a space, no
   argument yet) — the autocomplete dropdown should appear immediately
   with all 12 personas listed, each row showing `name — title`
   (e.g. `Marcus — Implementation Engineer`). This is the
   "immediately" path; without it, pi's built-in routes Tab on
   slash-command-with-arg to file completion and the dropdown never
   appears until the user types a letter.
6. Tab on `/become-persona M` — the dropdown should appear with the
   two `M`-prefixed personas (`Marcus`, `Maya`) and their titles.
7. Trigger an agent turn (any prompt). The next system prompt should now
   contain, in order: pi's default preamble, the loader-prepended
   `# Active Persona: Marcus` banner with the `**You are Marcus** ...
   superseding any prior persona identity` line, the `common.md` body,
   the `persona.md` body, the `memory.md` body, the per-project tier
   (every `*.md` under `<cwd>/.personas/<name>/`, sorted), the Memory
   Guidelines footer, and the closing `# Active Persona Confirmation`
   block reaffirming the new identity at the bottom. The opening
   `# Active Persona:` banner must be the first persona-flavored
   content in the system prompt; the closing confirmation must be
   the last persona-flavored content before the model begins
   generating. Additionally, no loader-injected section header should
   appear between the source bodies — there must be no `# Shared Persona
   Guidelines`, `# Persona Profile`, `# Persona Memory`, or
   `# Project Memory` heading; `common.md`'s body should render starting
   at its own first heading (currently `## Information Organization`,
   since `common.md` carries no H1 by design).
8. Run `/become-persona` with no argument — the toast should list
   available personas.
9. Run `/become-persona DoesNotExist` — should toast a red error.
10. End the turn — the next prompt should still contain persona content
    (the prompt is session-sticky until `/become-persona` is invoked again
    or the extension is reloaded).
11. Run `/reload` — the footer row should clear (it was tied to the
    extension instance). Re-run `/become-persona Marcus` to bring the
    persona and the footer back together.
12. (Title fallback) Edit `<persona>/persona.md` temporarily to remove
    the `## Title:` line. Re-run `/become-persona <persona>` — the
    footer should show `👤 <name>` with no em-dash and no trailing
    whitespace. Restore the `## Title:` line and re-run `/become-persona`
    to confirm the title returns to the footer.
13. (Identity assertion after a switch) Run `/become-persona Marcus`,
    then `/become-persona Vera`, then ask the agent a "Who are you?"
    prompt (or any prompt that elicits a self-identification). The
    agent's first response should name `Vera`, not `Marcus`, and should
    not paraphrase a prior "I am Marcus" answer that was given under
    the previous `/become-persona Marcus` turn. If the agent answers
    "Marcus" instead, the `# Active Persona:` banner has not done its
    job for this session and the symptom is a model-side limitation
    (see § 10 row 6) — the user-facing workaround is `/new` or
    `/compact` to clear conversation-history pattern-match.
14. (Behaviour-frame assertion after a switch) Run `/become-persona
    Marcus`, then `/become-persona Vera`, then ask the agent to do a
    task that is in-character for `Marcus` (e.g. "implement a C++
    function that …"). The agent should attempt the task (it is now
    the implementation engineer), not refuse as Vera would ("I only
    write tests, hand this off to Marcus"). The closing
    `# Active Persona Confirmation` block in the persona prompt is the
    loader-side mitigation for this behaviour-frame pattern-match;
    if the agent still acts as Vera on out-of-character tasks, the
    symptom is a model-side limitation (see § 10 row 6) and the
    user-facing workaround is `/new` or `/compact`.

No scratch files are produced during verification; nothing to clean up.

---

## 9. Coding conventions

- **Language level:** TypeScript with `import type` for type-only imports.
  No enums, no decorators, no namespaces.
- **Naming:** camelCase for variables and function parameters, PascalCase
  only for the imported type. `pendingPersonaPrompt`, `loadPersonaContent`,
  `listPersonas`, `resolvedPersonaDir`, `cleanName`, `commonContent`,
  `personaContent`, `memoryContent` — all camelCase, per the project's
  universal rule (see `personas/Marcus/memory.md`).
- **String concatenation vs. template literals:** template literals are used
  only where interpolation is needed (e.g. the identity banners, which
  interpolate `personaName`); plain strings are used for the fixed-shape
  headings (`"# Memory Guidelines\n"`, `# Active Persona Confirmation`).
  The loader no longer emits any per-source section banners — source
  files are concatenated verbatim with their own headings. Mixed
  deliberately — readability > consistency.
- **Function declarations, not arrow expressions**, for all named helpers.
  This keeps stack traces unambiguous and matches the rest of the
  extension folder.
- **One `console.warn` / `console.error` per failure path**, with a stable
  `[persona-loader]` prefix so the messages are greppable in the agent log.
- **Per-project tier auto-create is intentional.** On first adopt in a
  given cwd, the loader creates `<cwd>/.personas/<active persona>/`
  and writes an empty `project.md` so the per-project tier has a
  starting surface. This is a one-time write per cwd per persona —
  see § 1 (Scope) for the rationale and § 5 for the failure semantics.
- **Status-row ownership is the loader's.** The footer key `"persona"`
  is reserved for this extension. No other extension should use the
  same key; cross-extension key collisions produce clobbering that is
  hard to debug.
- **No destructuring on `process.env`**, no `__dirname`/`__filename`
  references — the module is loaded by jiti, not required as a CommonJS
  module, so those globals are not reliable here.

---

## 10. Known issues

- **State does not survive reload.** `pendingPersonaPrompt` is
  module-level and disappears when the extension is re-evaluated by
  jiti after `/reload`. After every edit to this file (and after every
  manual `/reload`), the user must re-run `/become-persona`. Persistence
  via a `~/.pi/agent/.persona-state.json` file was considered and
  rejected for multi-terminal use — a single shared slot would clobber
  itself across concurrent pi sessions in different terminals. The
  TUI footer status row follows the same lifetime (it disappears on
  `/reload` for the same reason, since the row is keyed by extension
  instance).
- **No filesystem caching.** Every `/become-persona` call re-reads all
  three markdown files from disk. For a handful of small files this is
  negligible; for users with very large `memory.md` files it would be
  worth measuring.
- **`console.*` writes are visible in agent output.** Unlike
  `ctx.ui.notify`, `console.warn`/`console.error` log lines surface in
  the same stream as agent replies. During heavy misconfiguration
  (e.g. permission denied on the personas directory) this can be noisy.
- **`common.md` is treated as optional but recommended.** If it is absent
  there is no warning; only `persona.md` is strictly required. Users who
  delete `common.md` will not notice the regression until they look at
  the system prompt.
- **No protection against symlink loops.** `readdirSync` is called with
  `withFileTypes` so symlinks to directories will be enumerated as
  subdirectories; the loader does not `realpath` them. In practice the
  personas directory is user-managed so this is a low-risk caveat.
- **Conversation-history pattern-match can override a fresh persona.** In
  long sessions the model can pattern-match a prior persona's "I am X"
  answer to a "Who are you?" prompt that was asked before a persona
  switch, and continue answering "X" even after the loader has staged
  a fresh prompt that names the new persona as the active identity. The
  loader-side mitigation is the `# Active Persona: <Name>` banner
  prepended at the top of `extraPrompt` (see § 4 step 5): the
  explicit `**You are <Name>** ... superseding any prior persona
  identity` line makes the freshly-staged identity salient. This is
  loader-level mitigation, not a guarantee — for adversarial cases
  (very long sessions with repeated "Who are you?" prompts under
  multiple personas), the user-facing workarounds are `/new` (clear
  the conversation), `/compact` (summarise away the prior persona
  answers), or `/reload` (re-stage the persona from scratch).
- **System-prompt authority is high-priority, not absolute — it blurs
  with context length.** Joachim observed (2026-07-03) that even a
  correctly-staged persona prompt loses authority as the surrounding
  conversation history accumulates: the system prompt is high-priority
  but not absolute, and in long sessions the accumulated context
  "blurs" the persona framing's attention weight, independent of any
  specific prior-persona pattern-match. This is an *orthogonal*
  failure mode to the row above — token-volume dilution rather than
  per-turn pattern-match. The closing `# Active Persona Confirmation`
  block (see § 4 step 5) partially offsets blur by giving the persona
  framing the most recent tokens in the system prompt; full immunity
  still requires `/compact` (compress the context) or `/new` (clear
  it) once the session grows past the model's effective attention
  span. This row is a model-side observation, not a loader
  limitation — the loader cannot directly reduce context length.
- **No per-source section headers; `common.md` is headingless.** The
  loader injects no provenance/section banners (`# Shared Persona
  Guidelines`, `# Persona Profile`, `# Persona Memory`, `# Project
  Memory`) between source files — each file is concatenated verbatim
  and is expected to carry its own top-level heading. `persona.md` and
  `memory.md` do. `common.md` does **not**: its H1 was removed (Idun,
  2026-07-04) precisely because the loader previously supplied a
  `# Shared Persona Guidelines (common.md)` wrapper that double-headed
  it; once that wrapper was dropped in favour of "pure instructions,
  no source provenance" (Joachim, 2026-07-04), the common block renders
  starting at its `## Information Organization` H2. This is intentional
  (per Joachim's call) — the orphaned H2 is accepted as the new normal
  rather than re-introducing an H1 in `common.md` (which is content
  outside the loader's scope). If a future persona author wants a
  top-level heading on the common block, the fix lives in `common.md`
  itself, not in the loader.

---

## 11. Where to read next

- **Contract / spec:** `extensions/persona-loader/README.md` — install,
  layout, command reference, troubleshooting.
- **Companion task brief:** none. The README.md above served as the
  up-front design and replaced a separate brief for this module.
- **Extension host API:** `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
  — lifecycle hook (`before_agent_start`), command
  registration (`registerCommand`, `getArgumentCompletions`), and the
  jiti loader's auto-discovery rules.
- **Sibling extensions** in `extensions/`:
  - `auto-context.ts` — also hooks `before_agent_start`; reading
    it is the fastest way to see how a *different* sort of system-prompt
    append is structured.
  - `dangerous-commands.ts` — unrelated, but a useful example of
    `registerCommand` with no tab completion.
  - `model-status.ts` — closest analog for the `setStatus` path;
    shows the pattern of calling `setStatus` from an event handler
    (here, `model_select` instead of `/become-persona`).
- **Persona content layout:** `personas/common.md` (the template that
  the loader actually inlines), `personas/<name>/persona.md` plus
  `personas/<name>/memory.md` for any installed persona, and
  `<cwd>/.personas/<active persona>/` as the per-project tier.
  See `personas/common.md` for the three-tier memory model and the rules
  on where each kind of fact belongs.
- **Next module to read if extending this one:** start at the
  `pendingPersonaPrompt` state. That variable is the seam where a future
  "persist persona across reloads" or "in-session persona clear" change
  would land — both of which would also need a new extension entry point
  (e.g. a `session_start` handler or a `/become-persona --clear` flag)
  since the current API offers neither.
