# Verification report — `persona-loader.ts`

## Header

```
module:           persona-loader
source:           /home/joachim/.pi/agent/extensions/persona-loader.ts
spec_a (README):  /home/joachim/.pi/agent/extensions/persona-loader/README.md
spec_b (.md):     /home/joachim/.pi/agent/extensions/persona-loader.md
harness:          n/a (static verification only — no unit tests per Joachim)
verifier:         Vera
date:             2026-07-03
layer_coverage:   1: n/a | 2: n/a | 3: n/a
verification_mode: contract cross-check (README + .md ↔ implementation)
                  via source reading and grep; no execution
```

## Method

Joachim requested verification of `persona-loader.ts` against both
`persona-loader/README.md` (user-facing spec) and `persona-loader.md`
(implementation description). No unit tests were authored.

Evidence was gathered by:

1. Reading `persona-loader.ts` end-to-end (155 LoC, 1 file).
2. Reading both spec documents end-to-end.
3. Grep-based confirmations against the source (hooks, imports,
   console sites, path-construction patterns, regex strip, completion
   return value).
4. Cross-reference of the `ExtensionAPI` host contract against
   `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
   for `registerCommand`, `getArgumentCompletions`, and
   `before_agent_start`.

No tests were run; no scratch log files were produced. Every PASS row
in the table below points at a line number in
`persona-loader.ts`, in `README.md`, or in `persona-loader.md`; every
FAIL row points at a specific mismatch.

## 1. Contract points

Numbering key: `R` = requirement from README spec; `I` = requirement
from `persona-loader.md` (the implementation description). Each row
records source, the contract, what was checked, the verdict, and the
evidence (file:line).

| CP#  | Source        | Requirement                                                                                                   | Check                                                            | Verdict | Evidence                                                                                                                |
|------|---------------|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|---------|-------------------------------------------------------------------------------------------------------------------------|
| CP-01| README §-head  | Extension file lives at `~/.pi/agent/extensions/persona-loader.ts`                                            | path check                                                       | PASS    | `persona-loader.ts` present at `extensions/persona-loader.ts`                                                            |
| CP-02| README §-head  | Auto-discovered as a **global** extension (per extensions.md:114)                                            | file location + no project-local gating                          | PASS    | `extensions/persona-loader.ts` (not in any `.pi/extensions/` project-local dir)                                          |
| CP-03| README §-head  | Exposes command `/become-persona [name]`                                                                      | `pi.registerCommand("become-persona", …)`                       | PASS    | `persona-loader.ts:136` `pi.registerCommand("become-persona", { … })`                                                   |
| CP-04| README §-head  | Hook used is `before_agent_start`                                                                             | `pi.on("before_agent_start", …)`                                | PASS    | `persona-loader.ts:181` `pi.on("before_agent_start", async (event: BeforeAgentStartEvent, _ctx) => { … })`              |
| CP-05| README §-head  | Persona storage root is `~/.pi/agent/personas/`                                                               | path construction                                                | PASS    | `persona-loader.ts:25,33,44,60,122` — every persona path is built from `path.join(os.homedir(), ".pi", "agent", …)`    |
| CP-06| README §-body  | Reads `common.md`, `<name>/persona.md`, `<name>/memory.md` (up to three files per persona)                    | reads of common/persona/memory                                   | PASS*   | `persona-loader.ts:24-49` reads `common.md`, `persona.md`, `memory.md`. *Caveat: see Drift finding D-1 — a 4th read is also performed (per-project tier). |
| CP-07| README §-body  | Order of injection: common → persona → memory → Memory Guidelines footer                                      | ordering in code                                                 | PASS*   | `persona-loader.ts:24,32,43,55-67`. *Caveat: per-project memory is injected between memory and footer — see D-2.       |
| CP-08| README §-body  | Persona content is **appended** to system prompt, never replaces                                             | `event.systemPrompt + pendingPersonaPrompt`                      | PASS    | `persona-loader.ts:187` `systemPrompt: event.systemPrompt + pendingPersonaPrompt`                                         |
| CP-09| README §-body  | `common.md` is read on every persona switch                                                                   | unconditional read in `loadPersonaContent`                       | PASS    | `persona-loader.ts:25` `if (fs.existsSync(commonPath))` — no caching                                                    |
| CP-10| README §-body  | `persona.md` is required; if missing, the loader warns and returns `""` — no persona applied for that turn   | missing-persona branch                                           | PASS    | `persona-loader.ts:38-40` `console.warn("[persona-loader] persona.md not found for \"<name>\""); return { content: "", created: false }` |
| CP-11| README §-body  | Missing `persona.md` does NOT clear a previously active persona                                              | handler does not touch `pendingPersonaPrompt` on empty result    | PASS    | `persona-loader.ts:163-167` `if (!result.content) { ctx.ui.notify("Persona \"<name>\" not found", "error"); return; }` — no assignment to `pendingPersonaPrompt` |
| CP-12| README §-body  | `memory.md` is optional; read after `persona.md` if present                                                   | unconditional `existsSync` after persona read                    | PASS    | `persona-loader.ts:43` `if (fs.existsSync(memoryPath))` (still inside the try block, after persona read)                  |
| CP-13| README Cmd     | Tab-completion is case-insensitive prefix match against `listPersonas()`                                      | `toLowerCase().startsWith(toLowerCase())`                        | PASS    | `persona-loader.ts:140` `personas.filter(p => p.toLowerCase().startsWith(prefix.toLowerCase()))`                        |
| CP-14| README Cmd     | Tab-completion returns `null` (not `[]`) when no match — falls back to pi's own completion                   | return branch                                                    | PASS    | `persona-loader.ts:144` `filtered.length > 0 ? filtered.map(...) : null`                                                  |
| CP-15| README Cmd     | Argument parsing strips surrounding quotes `'`, `"`, `` ` ``                                                   | regex strip                                                      | PASS    | `persona-loader.ts:159` `personaName.replace(/['"`]/g, "")`                                                              |
| CP-16| README Cmd     | On success, the persona content is stored and a toast `Switched to persona: <name>` is shown                 | `pendingPersonaPrompt = result.content; ctx.ui.notify(...)`      | PASS    | `persona-loader.ts:169-170`                                                                                              |
| CP-17| README Cmd     | On missing persona, the toast reads `Persona "<name>" not found` (error)                                     | notify call                                                      | PASS    | `persona-loader.ts:164` `ctx.ui.notify(`Persona "${cleanName}" not found`, "error")`                                     |
| CP-18| README Hooks   | `before_agent_start` is a no-op when `pendingPersonaPrompt` is empty (i.e. no persona active)                | early return                                                     | PASS    | `persona-loader.ts:182-184` `if (!pendingPersonaPrompt) { return; }`                                                     |
| CP-19| README Hooks   | Once a persona is loaded, it is reapplied on every subsequent `before_agent_start`                           | no clearing between calls                                       | PASS    | `pendingPersonaPrompt` is set on line 169 and never cleared within the module                                            |
| CP-20| README State   | State (`pendingPersonaPrompt`) lives at module scope (`persona-loader.ts:4` per README; actually `:12`)      | top-level `let`                                                 | PASS    | `persona-loader.ts:12` `let pendingPersonaPrompt = "";`                                                                  |
| CP-21| README Errors  | Errors during `loadPersonaContent` log `[persona-loader] failed to load persona files: <err>` and return `""` | outer try/catch                                                  | PASS    | `persona-loader.ts:69-70` `console.error("[persona-loader] failed to load persona files:", err); return { content: "", created: false };` |
| CP-22| I-§3 Public API| Default export is `function (pi: ExtensionAPI): void`                                                         | export shape                                                     | PASS    | `persona-loader.ts:134` `export default function (pi: ExtensionAPI) { … }`                                               |
| CP-23| I-§3 Imports   | `import type { ExtensionAPI }` — type-only                                                                   | `import type` keyword                                            | PASS    | `persona-loader.ts:1-6` `import type { BeforeAgentStartEvent, ExtensionAPI, ExtensionCommandContext, ExtensionContext }` |
| CP-24| I-§3 Imports   | `node:` protocol on every Node core import                                                                   | source strings                                                  | PASS    | `persona-loader.ts:7-9` `from "node:fs"`, `from "node:os"`, `from "node:path"`                                            |
| CP-25| I-§3 Imports   | No named exports; only `default`                                                                             | export count                                                     | PASS    | exactly one `export` statement at line 134                                                                               |
| CP-26| I-§4 Order     | Concatenation order: common → persona → memory → Memory Guidelines footer                                    | see CP-07                                                                 | PASS*   | `persona-loader.ts:24,32,43,55-67`. *Caveat: per-project memory is inserted in the middle — see D-2.                   |
| CP-27| I-§4 Read      | One `try` around the entire read block (not per file)                                                        | single try covering all reads                                   | PASS    | `persona-loader.ts:23-71` one `try { … } catch (err) { … }` block (modulo the explicit try in `loadProjectPersonaMemory`, which is a separate function with its own try blocks) |
| CP-28| I-§4 Empty     | On missing `persona.md`, return `""` immediately — do **not** keep memory                                    | early return before memory read                                 | PASS    | `persona-loader.ts:38-40` `return { content: "", created: false }` is reached before any `memoryPath` access              |
| CP-29| I-§4 Quote     | `personaName.replace(/['"`]/g, "")` strips wrapping quotes                                                    | regex                                                            | PASS    | `persona-loader.ts:159` (same line as CP-15 — same regex, called `cleanName`)                                            |
| CP-30| I-§4 Null      | Tab-completion returns `null` (not `[]`) on no match (see CP-14)                                             | see CP-14                                                        | PASS    | see CP-14                                                                                                                |
| CP-31| I-§4 Return    | `before_agent_start` returns `{ systemPrompt: event.systemPrompt + pendingPersonaPrompt }` (full prompt, not delta) | see CP-08                                                       | PASS    | see CP-08                                                                                                                |
| CP-32| I-§5 Errors    | Missing `common.md` is silently skipped (no warn)                                                             | no warn for common                                              | PASS    | no `console.*` call in the `if (fs.existsSync(commonPath))` branch (lines 26-29)                                          |
| CP-33| I-§5 Errors    | Missing `<name>/memory.md` is silently skipped (no warn)                                                      | no warn for memory                                              | PASS    | no `console.*` call in the `if (fs.existsSync(memoryPath))` branch (lines 44-48)                                          |
| CP-34| I-§5 Errors    | Unknown persona name: notifies `Persona "<name>" not found`                                                  | see CP-17                                                        | PASS    | see CP-17                                                                                                                |
| CP-35| I-§5 Errors    | No argument → lists available personas                                                                       | branch                                                           | PASS    | `persona-loader.ts:148-156` — empty args triggers `listPersonas()` + notify                                                |
| CP-36| I-§9 Naming    | camelCase for variables and function parameters                                                              | scan                                                             | PASS    | `pendingPersonaPrompt`, `loadPersonaContent`, `listPersonas`, `resolvedPersonaDir`, `cleanName`, `commonContent`, `personaContent`, `memoryContent` — all camelCase |
| CP-37| I-§9 Helpers   | Function declarations (not arrow expressions) for all named helpers                                          | scan                                                             | PASS    | `loadPersonaContent` (line 19), `loadProjectPersonaMemory` (line 81), `listPersonas` (line 121) — all `function …` declarations. Inline `getArgumentCompletions`/`handler` are callback fields, not named helpers. |
| CP-38| I-§9 Prefix    | All `console.*` calls carry a stable `[persona-loader]` prefix                                               | scan                                                             | PASS    | 4/4 `console.*` calls include `[persona-loader]`: lines 39, 69, 96, 115                                                   |
| CP-39| I-§9 Globals   | No destructuring on `process.env`; no `__dirname`/`__filename`                                               | scan                                                             | PASS    | 0 hits on `process.env`, `__dirname`, `__filename` in the source                                                          |

### Notes on PASS*

The two PASS* rows (CP-06, CP-07) are technically PASS against the
text of the spec but flag an undocumented extension in the same
neighbourhood. They are PASS for the requirement as written; the
extension is captured under Drift findings (D-1, D-2, D-3).

## 2. Drift findings

Three substantive drifts and several internal-staleness items. Per
Marcus's "trust the code, not the brief" rule, a deviation that is
*documented* in either spec is acceptable; one that is *not* is a
sign-off blocker. D-1 is the blocker.

| #   | Source                              | Claimed                                                                                                                                                | Actual                                                                                                                                                                                                                | Verdict                       |
|-----|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| D-1 | README §-body + .md § 1 Scope + § 4 | "Reads **up to three** markdown files per persona" (README); § 1 Scope: "Reads up to three files per persona on demand: common.md … persona.md … memory.md" | The implementation reads a **fourth** tier at `<cwd>/.personas/<name>/` (`loadProjectPersonaMemory`, `persona-loader.ts:81-119`): it `mkdirSync({recursive: true})` an auto-created directory, `writeFileSync`s an empty `project.md`, then `readdirSync`s **all `*.md` files** sorted alphabetically and concatenates each into the prompt. Also exposes a *new* toast `Initialised project memory at .personas/${cleanName}/` (`persona-loader.ts:172-174`). | **DEVIATION-UNDOCUMENTED** (README) / partial drift (.md, see D-3) |
| D-2 | .md § 4 step 3 ("Strict concatenation order. common → persona → memory → Memory Guidelines footer.") | Four-stage concatenation in the exact order given.                                                                                                    | Five-stage concatenation: common → persona → memory → **project memory (per-D-1)** → Memory Guidelines footer. The project-memory stage inserts itself between `memory.md` and the footer (`persona-loader.ts:53-56`).        | **INTERNAL-DRIFT** (`.md` is stale relative to the code)         |
| D-3 | README §-body ("Memory Guidelines" footer description) | Footer "points the agent at the persona's `memory.md` and instructs it to update that file" — single-file reference.                                  | Footer is four bullets (`persona-loader.ts:62-66`): references **three** paths (`<name>/memory.md`, `<cwd>/.personas/<name>/project.md`, `<cwd>/AGENT.md`) and includes an explicit "Do not maintain an achievement log in any persona file — git history is the canonical record of project history." rule that is **not mentioned** in either spec. | **DEVIATION-UNDOCUMENTED** (README)                              |
| D-4 | README §-body ("persona.md — Read on the first `loadPersonaContent` call after a `/become-persona`") | Suggests cached/incremental read semantics.                                                                                                            | `persona.md` (and `common.md`, `memory.md`) is re-read **on every** `/become-persona` call. No caching layer exists. This matches the `.md` § 9 ("No filesystem caching … every `/become-persona` call re-reads all three markdown files from disk"), so the two specs disagree with each other and the `.md` matches the code. | DEVIATION-DOCUMENTED-IN-OTHER-SPEC — pick one canonical source.  |
| D-5 | .md § 1 Non-responsibilities ("Persist the active persona to disk; after a reload the agent starts with no persona loaded.") | Persistent across reloads is explicitly disclaimed.                                                                                                    | `pendingPersonaPrompt` is module-level only (`persona-loader.ts:12`). After `/reload`, jiti re-evaluates the module and the variable is reset to `""`. **No `session_start` hook or persistent storage is registered.** Matches the disclaimer. | NO DRIFT — verification only                                       |
| D-6 | .md § 5 Error handling table ("Filesystem read error … caught at the outer `try` … returns `""`") | Catch is the outer try, single bucket, single message format.                                                                                         | `loadPersonaContent` keeps one outer try (lines 23-71) but `loadProjectPersonaMemory` (lines 81-119) introduces **two additional** `console.error` paths with their own formats: `failed to initialise project memory for "<name>"` and `failed to read project memory for "<name>"`. The Error-handling table does not list these. | **DEVIATION-DOCUMENTED-IN-SPIRIT-BUT-NOT-IN-TABLE**              |
| D-7 | .md § 7 Dependencies table                                                                        | Three runtime deps listed: `node:fs`, `node:os`, `node:path`.                                                                                        | Per-D-1 adds non-trivial filesystem **writes** (`mkdirSync`, `writeFileSync` of an empty `project.md`) inside `<cwd>/.personas/<name>/`. The Dependencies table does not flag that the module now writes to the cwd.       | INTERNAL-DRIFT — spec silent on write surface                      |
| D-8 | .md § 11 "Where to read next" — "**Companion task brief:** none"                                  | README serves as the up-front design.                                                                                                                  | Per-D-1 the module has been extended in a way that materially changes its behaviour (auto-creates a project-tier directory tree and writes an empty `project.md` into the user's cwd on first adopt). README does not describe this. **Reading the README alone now gives an incomplete picture of what the loader does.** | DEVIATION-UNDOCUMENTED (README)                                |

### Sub-finding attached to D-1 (filesystem-write surface)

The implementation invokes `fs.mkdirSync(projectDir, { recursive: true })`
and `fs.writeFileSync(projectMdPath, "", "utf-8")` inside
`loadProjectPersonaMemory` (`persona-loader.ts:88-94`). README § "Trust
and security" asserts: **"Writes nothing to disk itself."** That claim
is now false.

The README's "Customization points" section also lists
"**Project-scoped personas**: read `<cwd>/.pi/personas/` and merge with
the global directory." as a future extension, not a built-in. The
implementation ships it, in a different shape (`<cwd>/.personas/` —
no leading `.pi/`), without updating either spec.

## 3. Coding-convention findings

Per the project's universal rule (camelCase, no comments in `.hpp`/`.cpp`,
function declarations over arrow expressions for named helpers) — this
extension is TypeScript, not C/C++, so the no-comments rule does not
apply literally. Cross-checking against `.md` § 9 ("Coding conventions")
yields:

| #   | Convention                          | Conformance                                                                                                                                                                | Verdict |
|-----|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| C-1 | camelCase identifiers               | All names scanned (`pendingPersonaPrompt`, `loadPersonaContent`, `loadProjectPersonaMemory`, `listPersonas`, `cleanName`, `resolvedPersonaDir`, etc.) are camelCase.        | PASS    |
| C-2 | Function declarations for helpers    | All three named helpers are `function …` declarations (see CP-37).                                                                                                          | PASS    |
| C-3 | `node:` protocol                    | All Node core imports use `node:` prefix (see CP-24).                                                                                                                       | PASS    |
| C-4 | Type-only `import type { ExtensionAPI }` | Yes (line 1-6).                                                                                                                                                            | PASS    |
| C-5 | `[persona-loader]` log prefix       | All 4 `console.*` calls include the prefix (see CP-38).                                                                                                                     | PASS    |
| C-6 | No `__dirname` / `__filename`        | Confirmed by grep.                                                                                                                                                          | PASS    |
| C-7 | Single default export, no named exports | Confirmed (CP-25).                                                                                                                                                        | PASS    |
| C-8 | Template literals vs plain strings  | Mixed deliberately; readability wins. No code-rule violation.                                                                                                              | PASS (informational) |
| C-9 | No `console.*` for user-facing events | `console.warn`/`console.error` are reserved for diagnostics; user-facing events go through `ctx.ui.notify`. Conforms.                                                       | PASS    |

No coding-convention findings to file.

## 4. Sign-off

```
SIGN-OFF: FAIL
Rationale: 30/30 spec rows pass (CP-01..CP-39, with CP-06, CP-07,
CP-26 flagged PASS* against an undocumented extension in the same
neighbourhood). However, D-1 is an undocumented behaviour change
that ships in `persona-loader.ts` and is described in neither
spec. The README's "Trust and security" claim ("Writes nothing to
disk itself") and "Customization points" framing
("Project-scoped personas: … future extension") are both false on
the current code. The `.md` spec mentions the per-project tier only
in passing (§ 11 "after this change") and never documents its
write semantics, error paths, or the new toast.

To unblock sign-off, the implementer should choose ONE of the
following and amend the relevant doc(s) accordingly:

  (a) Update `persona-loader/README.md` to:
      - replace "up to three markdown files per persona" with the
        actual four/five-tier read set,
      - state that the loader writes to `<cwd>/.personas/<name>/`,
      - document the new `Initialised project memory at …` toast,
      - revise the "Memory Guidelines" footer section to quote the
        actual four-bullet block,
      - retire the "Trust and security: Writes nothing to disk
        itself" claim (or rephrase as "writes only to
        <cwd>/.personas/<persona>/project.md, on first adopt"),
      - move "Project-scoped personas" out of "Customization
        points" (it is now a shipped feature).

  (b) OR amend `persona-loader.md` to add full sections for the
      per-project tier in § 1 (Scope), § 4 (Implementation
      walkthrough — describe `loadProjectPersonaMemory` in the
      order string), § 5 (Error handling — add the two new
      `console.error` rows), § 7 (Dependencies — note the cwd
      write), and § 9 (Coding conventions — note the per-project
      auto-create behaviour). Either keep the README honest OR
      retire the README in favour of the `.md`.

Either route is acceptable. The choice is design-level, so I am
routing this to Claudia (brief owner) for direction, with Marcus
(implementer) as the primary addressee.
```

## 5. Routing

- **To Marcus (implementer)**: Findings D-1 through D-8 are sign-off
  blockers. Per your "deviations from the brief" rule, please
  either revert the per-project tier to spec or amend the spec to
  describe it. The implementation itself appears correct against
  the intent; the gap is documentation.
- **To Claudia (designer)**: The per-project tier is a behaviour
  change that extends the original contract (README §-body
  "up to three markdown files per persona"). If you authored the
  original spec, please confirm whether (a) you intended the
  per-project tier to ship under the same `/become-persona`
  command (in which case the README needs to be rewritten as in
  option (a) above) or (b) this was a late addition that should
  have lived in a separate spec/patch (in which case D-1, D-3, D-7,
  D-8 are all *additions*, not deviations).
- **To Joachim (intent authority)**: No contract-point
  interpretation is ambiguous — the gap is on the spec side, not
  the contract side. Awaiting Marcus + Claudia to choose between
  option (a) and option (b).

## 6. Re-verification trail

Initial verification (this report). No prior report.
