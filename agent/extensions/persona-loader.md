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
- Reads up to three files per persona on demand:
  `common.md` (shared, persona-agnostic), `<name>/persona.md` (role),
  and `<name>/memory.md` (working notes).
- Appends a "Memory Guidelines" footer that points the agent at its own
  `memory.md` and instructs it to update that file when remembered/corrected.
- Registers tab-completion against the discovered persona names.
- On `before_agent_start`, returns a `systemPrompt` composed of pi's
  existing prompt plus the staged persona content.
- On `agent_end`, clears the staged content so the next turn is clean.

### Non-responsibilities

The module deliberately does **not**:

- Replace or rewrite pi's existing system prompt — it only appends.
- Validate, lint, or parse the markdown contents; it treats them as opaque text.
- Edit any persona file itself (writing to disk is the agent's job).
- Persist the active persona to disk; after a reload the agent starts with
  no persona loaded. `/become-persona` must be re-issued.
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
   and `agent_end` reliably resets it so the next turn is clean. The
   alternative (passing state through `ctx` or an external store) would
   exceed what the extensions API offers.

   *Caveat:* module-level state does **not** survive a `jiti` reload. After
   `/reload` the prompt must be re-applied with another `/become-persona`
   call. This is documented under § 10.

2. **`try` around the entire read block, not per file.** A single failure
   (e.g. permission denied on `common.md`) would otherwise leak partial
   output to the system prompt. The block also returns the empty string on
   failure so the handler can surface a single, consistent "not found"
   message.

3. **Strict concatenation order.** `common.md` → persona profile →
   persona memory → Memory Guidelines footer. The footer is appended inside
   the function rather than by the hook so it travels as part of the same
   prompt payload and is identical regardless of which hook fires. Keeping
   the footer last positions the CRITICAL update instruction closest to the
   agent's *current* behaviour — i.e. the rules of engagement come after
   the role, so the agent processes them as the most recent context.

4. **Empty string on missing `persona.md`.** If `persona.md` is absent
   the function logs a `console.warn` and returns `""` *immediately*, even
   if `memory.md` exists. A persona without a role definition is not a
   persona; silently keeping the memory would mask the misconfiguration.
   The handler treats `""` as "not found" and notifies accordingly.

5. **`personaName.replace(/['"`]/g, "")`** defensively strips wrapping
   quotes. The slash-command parser sometimes preserves literal quotes from
   the input line, and a typo like `/become-persona 'Marcus '` should not
   fail just because the user fat-fingered a quote.

6. **Tab-completion is a case-insensitive prefix match against
   `listPersonas()`**, returning `null` (not `[]`) when nothing matches.
   Per the extension API contract, `null` lets pi fall back to its own
   completion, which is the correct behaviour when no persona starts with
   the prefix the user has typed.

7. **`return { systemPrompt: event.systemPrompt + pendingPersonaPrompt }`.**
   Returning the whole prompt — not a delta — is required by the hook's
   contract; pi replaces its own systemPrompt with whatever object is
   returned. The order (existing first, persona second) matches the README
   spec and is deliberate: appending after pi's own preamble keeps
   pi-managed content authoritative.

---

## 5. Error handling

| Failure mode | Where | Behaviour |
| --- | --- | --- |
| `common.md` missing | `loadPersonaContent` | Silently skipped. The persona-specific content is still loaded. |
| `<name>/persona.md` missing | `loadPersonaContent` | Logs `[persona-loader] persona.md not found for "<name>"` via `console.warn`, returns `""`. Memory is also discarded. |
| `<name>/memory.md` missing | `loadPersonaContent` | Silently skipped. |
| Filesystem read error (permissions, ENOENT during race, etc.) | `loadPersonaContent` | Caught at the outer `try`, logged as `[persona-loader] failed to load persona files: <err>`, returns `""`. |
| Unknown persona name | handler | `ctx.ui.notify('Persona "<name>" not found', 'error')` and returns. |
| No argument provided to `/become-persona` | handler | Lists available personas via `ctx.ui.notify`, returns. |
| `~/.pi/agent/personas/` unreadable | `listPersonas` | Returns `[]`; downstream the user sees an empty persona list. |

Diagnostics from `loadPersonaContent` go to `console.error` / `console.warn`
rather than `ctx.ui.notify` because they can fire before the UI handler runs
(in the `before_agent_start` path) and because they're expected to be rare
configuration problems, not user-facing events.

---

## 6. Import hygiene

The header's full import list:

- `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";`
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
| `node:fs` | Source | `existsSync`, `readFileSync`, `readdirSync` — filesystem reads of persona files. |
| `node:os` | Source | `homedir()` to resolve `~/.pi/agent/personas/`. |
| `node:path` | Source | `path.join` for persona + memory file paths. |

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
   `Switched to persona: Marcus`.
5. Trigger an agent turn (any prompt). The next system prompt should now
   contain, in order: pi's default preamble, the `common.md` body, the
   `persona.md` body, the `memory.md` body, and the Memory Guidelines footer.
6. Run `/become-persona` with no argument — the toast should list
   available personas.
7. Run `/become-persona DoesNotExist` — should toast a red error.
8. End the turn — the next prompt should not contain persona content
   anymore (because `agent_end` cleared the staged prompt).

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
  only where interpolation is needed; plain strings are used for the
  fixed-shape section banners (`"# Shared Persona Guidelines (common.md)\n"`
  etc.). Mixed deliberately — readability > consistency.
- **Function declarations, not arrow expressions**, for all named helpers.
  This keeps stack traces unambiguous and matches the rest of the
  extension folder.
- **One `console.warn` / `console.error` per failure path**, with a stable
  `[persona-loader]` prefix so the messages are greppable in the agent log.
- **No destructuring on `process.env`**, no `__dirname`/`__filename`
  references — the module is loaded by jiti, not required as a CommonJS
  module, so those globals are not reliable here.

---

## 10. Known issues

- **State does not survive reload.** `pendingPersonaPrompt` is module-level
  and disappears when the extension is re-evaluated by jiti after
  `/reload`. After every edit to this file (and after every manual
  `/reload`), the user must re-run `/become-persona`. A future improvement
  would be to persist the chosen persona name to a small JSON file under
  `~/.pi/agent/` and re-stage on `session_start`.
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

---

## 11. Where to read next

- **Contract / spec:** `extensions/persona-loader/README.md` — install,
  layout, command reference, troubleshooting.
- **Companion task brief:** none. The README.md above served as the
  up-front design and replaced a separate brief for this module.
- **Extension host API:** `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
  — lifecycle hooks (`before_agent_start`, `agent_end`), command
  registration (`registerCommand`, `getArgumentCompletions`), and the
  jiti loader's auto-discovery rules.
- **Sibling extensions** in `extensions/`:
  - `auto-context.ts` — also hooks `before_agent_start`; reading
    it is the fastest way to see how a *different* sort of system-prompt
    append is structured.
  - `dangerous-commands.ts` — unrelated, but a useful example of
    `registerCommand` with no tab completion.
- **Persona content layout:** `personas/common.md` (the template that
  the loader actually inlines) and `personas/<name>/persona.md` plus
  `personas/<name>/memory.md` for any installed persona.
- **Next module to read if extending this one:** start at the
  `pendingPersonaPrompt` state and the `agent_end` reset — those two
  are the seam where a future "persist persona across reloads" change
  would land.
