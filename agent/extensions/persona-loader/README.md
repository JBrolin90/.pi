# persona-loader

A pi extension that lets the user switch the agent's role at runtime by loading a "persona" — a bundle of markdown files that get appended to the system prompt on the next agent turn.

- **Extension file**: `~/.pi/agent/extensions/persona-loader.ts`
- **Auto-discovered as**: a global extension (per `docs/extensions.md:114`)
- **Command exposed**: `/become-persona [name]`
- **Hooks used**: `before_agent_start`, `agent_end`
- **Persona storage**: `~/.pi/agent/personas/`

## What it does

The extension reads up to three markdown files per persona and appends their contents to pi's system prompt before each agent turn:

1. `~/.pi/agent/personas/common.md` — shared guidelines that apply to **every** persona.
2. `~/.pi/agent/personas/<name>/persona.md` — the role definition.
3. `~/.pi/agent/personas/<name>/memory.md` — persona-specific notes, preferences, and accumulated knowledge.

It also injects a "Memory Guidelines" footer that points the agent at the persona's `memory.md` and instructs it to update that file when the user asks it to remember something, corrects it, or new information is learned.

The persona content is **appended** to the system prompt that pi has already built (which includes any `AGENTS.md`/`CLAUDE.md` and `SYSTEM.md`/`APPEND_SYSTEM.md`). It does not replace anything.

## Installation

The extension is a single TypeScript file at `~/.pi/agent/extensions/persona-loader.ts`. pi's jiti-based loader picks it up automatically (per `docs/extensions.md:178`); no compilation or `package.json` is required.

To install elsewhere (project-local, or as a git/npm package), see `docs/extensions.md`. The relevant facts:

- `~/.pi/agent/extensions/*.ts` — global
- `.pi/extensions/*.ts` — project-local (gated by project trust)
- `settings.json` `extensions` array — additional arbitrary paths

Reload with `/reload` after moving the file (per `docs/extensions.md:7`).

## Personas directory layout

```
~/.pi/agent/personas/
├── common.md                  # Shared guidelines (optional but recommended)
├── Claudia/
│   ├── persona.md             # Role definition
│   └── memory.md              # Working notes (optional)
├── Diane/
│   ├── persona.md
│   └── memory.md
├── Pi/
│   ├── persona.md
│   └── memory.md
└── ...
```

The persona directory must be a sibling of `common.md`; the loader discovers personas by listing subdirectories of `~/.pi/agent/personas/`. A persona is "valid" iff it has a `persona.md`. `memory.md` is optional.

## Commands

### `/become-persona [name]`

Switch to a persona. With no argument, lists the available personas.

- **Argument completions**: tab-completion iterates the subdirectories of `~/.pi/agent/personas/`, case-insensitive prefix match.
- **Argument parsing**: surrounding quotes (`'`, `"`, `` ` ``) are stripped before lookup.
- **Behavior on success**: stores the assembled persona content in module-level state (`pendingPersonaPrompt`) and shows a `Switched to persona: <name>` toast.
- **Behavior on missing persona.md**: warns to stderr (`[persona-loader] persona.md not found for "<name>"`), notifies `Persona "<name>" not found` to the UI, and does **not** clear any previously active persona.

## Hooks

### `before_agent_start`

```ts
pi.on("before_agent_start", async (event, _ctx) => {
  if (!pendingPersonaPrompt) return;
  return { systemPrompt: event.systemPrompt + pendingPersonaPrompt };
});
```

- Only fires if a persona is currently active. Returns `undefined` otherwise, leaving the system prompt untouched.
- **Appends**, never replaces. The chained system prompt that pi has built (AGENTS.md, SYSTEM.md, tool snippets, prior extension handlers) is preserved.
- Handlers run in extension load order (per `docs/extensions.md:764`); a later extension can still mutate the prompt after this one.

### `agent_end`

```ts
pi.on("agent_end", async (_event, _ctx) => {
  pendingPersonaPrompt = "";
});
```

- Clears the active persona at the end of every agent turn.
- **Consequence**: personas persist for exactly one agent turn. After the turn ends, you must run `/become-persona <name>` again to re-apply for the next turn. There is no "sticky" persona.
- This is a deliberate one-shot design — see "Design notes" below.

## Persona file semantics

### `common.md`

Read on every persona switch. Use it for cross-persona conventions: voice, organization principles, where to store facts, how to handle corrections, etc. The Pi persona (this author's) is a good example; it references a "Common Guidance" pattern.

### `persona.md`

The role definition. Read on the first `loadPersonaContent` call after a `/become-persona`. If absent, the loader logs a warning and returns `""` — no persona is applied for that turn.

Convention: keep `persona.md` stable. Role, expertise, tone, and tool usage go here.

### `memory.md`

Optional. Read after `persona.md` if present. This is where dynamic state, preferences, and learned facts accumulate.

The injected "Memory Guidelines" footer explicitly tells the agent:

> **CRITICAL**: If the user explicitly asks you to remember something, corrects you, or you learn something new, you MUST proactively update your memory file using your file editing tools.

So the persona's `memory.md` is expected to be a living document, not a one-time write.

## Module-level state: `pendingPersonaPrompt`

The variable lives at module scope (`persona-loader.ts:4`). Implications:

- **Persists across events** within the same extension instance.
- **Survives `/reload`?** Not documented; the file is re-imported via jiti, so the new instance gets a fresh empty string. Empirically, you should re-run `/become-persona` after `/reload` to be safe.
- **Race condition**: if two `before_agent_start` events fire concurrently (uncommon but possible with parallel agents), they would read the same value. In practice pi processes turns sequentially, so this is theoretical.
- **One-shot by design**: see the "Consequence" under `agent_end` above. The model is "persona is applied to the *next* turn only," not "persona is active for the session."

## Error handling

The whole `loadPersonaContent` body is wrapped in a `try`/`catch`. On any thrown error (filesystem permissions, encoding issues, etc.), the loader:

- Logs to stderr: `[persona-loader] failed to load persona files: <err>`.
- Returns `""`.
- The `/become-persona` handler then notifies `Persona "<name>" not found` (the empty-result branch).

So a corrupted or unreadable persona silently fails to apply. The agent runs without persona content for that turn, with no other side effects.

## Trust and security

This is a **global** extension: it auto-loads on every pi session, in every project, regardless of trust state (per `docs/extensions.md:114` and the `project_trust` ordering at `docs/extensions.md:342`). It:

- Reads from a fixed directory under `$HOME/.pi/agent/personas/`.
- Writes nothing to disk itself.
- Has no network, no subprocess, no eval, no shell-out.

The only attack surface is the persona markdown files themselves, which become part of the system prompt. Treat `~/.pi/agent/personas/**/persona.md` and `memory.md` with the same trust as `AGENTS.md` — they instruct the LLM with the agent's full tool access.

## Design notes

- **Append, don't replace**: matching pi's `before_agent_start` chaining model. The persona inherits AGENTS.md, CLAUDE.md, SYSTEM.md, and any other extension's contributions.
- **One-shot persona**: the `agent_end` clear is intentional. It keeps the model explicit ("I am this persona *for this turn*") rather than implicit ("I am always this persona"), which would make it easy to forget you're in a persona. The trade-off is friction: every turn of a long task needs a re-switch.
- **Quoted argument stripping**: the `/become-persona "Foo Bar"` form is supported because users naturally quote multi-word names. The strip is naive — embedded quotes in persona names would break — but no persona name should contain a quote character in practice.
- **`common.md` always read**: it is re-read on every `/become-persona`, so editing it is picked up on the next switch without reloading the extension.

## Customization points

Things you might want to change for your own fork:

- **Sticky persona**: remove the `agent_end` clear, or change it to a no-op.
- **Project-scoped personas**: read `<cwd>/.pi/personas/` and merge with the global directory.
- **Persona as a slash command argument**: allow `pi /become-persona Foo "be brief"` style extra instructions appended to the prompt.
- **Hot-reload persona files**: re-read `persona.md`/`memory.md` on every `before_agent_start` rather than only on `/become-persona` (so edits to `memory.md` from inside the agent take effect on the *next* turn without a re-switch).
- **Validation**: fail loudly (e.g. toast) instead of silently returning `""` when `persona.md` is missing.
- **Trust gate**: drop the global scope and move to a project-local `.pi/extensions/persona-loader.ts` if you want it scoped to trusted projects only.

## Limitations and known sharp edges

- **One turn per `/become-persona`**. If you forget, the next turn runs with the default prompt.
- **No argument validation** beyond the quote strip. `../etc/passwd` would resolve to `~/.pi/agent/personas/../etc/passwd` only if a directory of that name existed, which it cannot by construction — `listPersonas` filters to directories and `loadPersonaContent` only reads `persona.md`/`memory.md` from them — but a persona literally named `..` could in principle resolve oddly. In practice, `listPersonas` is the only entry point the user has.
- **`memory.md` content is the persona's view of truth.** Because the extension tells the agent to "proactively update your memory file" on corrections, the memory file can drift. Review it periodically.
- **No concurrency safety** on `pendingPersonaPrompt`. Fine for single-agent use; would need locking for multi-agent setups.
- **The "CRITICAL" memory-update instruction is unconditional.** It is appended on every persona switch regardless of whether the user wants an updateable persona. If you want a read-only persona, you would need to fork the extension to suppress the footer.

## Files

| Path | Purpose |
|---|---|
| `persona-loader.ts` | The extension source (this is the single installed file). |
| `persona-loader/README.md` | This document. Co-located per the convention in `common.md` (Single Source of Truth). |
| `~/.pi/agent/personas/common.md` | Shared persona guidelines. |
| `~/.pi/agent/personas/<name>/persona.md` | Per-persona role. |
| `~/.pi/agent/personas/<name>/memory.md` | Per-persona working notes. |

## Source-line index (persona-loader.ts)

- `4` — module-level `pendingPersonaPrompt` declaration
- `6-44` — `loadPersonaContent` (common → persona → memory → memory guidelines)
- `46-56` — `listPersonas`
- `58-95` — `/become-persona` command registration (description, completions, handler)
- `97-105` — `before_agent_start` handler (appends to system prompt)
- `107-109` — `agent_end` handler (clears the active persona)
