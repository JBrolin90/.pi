# persona-loader

A pi extension that lets the user switch the agent's role at runtime by loading a "persona" — a bundle of markdown files that get appended to the system prompt on every agent turn for the remainder of the session.

- **Extension file**: `~/.pi/agent/extensions/persona-loader.ts`
- **Auto-discovered as**: a global extension (per `docs/extensions.md:114`)
- **Command exposed**: `/become-persona [name]`
- **Hooks used**: `before_agent_start`
- **Persona storage**: `~/.pi/agent/personas/`

## What it does

The extension reads the global persona bundle and, on first adopt in a given working directory, lazily initialises a per-project memory tier for the active persona. On every `/become-persona`, an identity-assertion banner is prepended, four sources are concatenated **verbatim with no loader-injected section headers between them** (each source carries its own top-level heading), and a Memory Guidelines footer plus a closing identity confirmation are appended, in this order:

0. **`# Active Persona: <name>` banner** (loader-prepended, unconditional). A one-line `**You are <name>** ... superseding any prior persona identity established through earlier conversation in this session` assertion. Gives the model an unambiguous, attention-grabbing identity statement before any other content so it attends to the new identity rather than pattern-matching a prior persona from conversation history in long sessions.
1. `~/.pi/agent/personas/common.md` — shared guidelines that apply to **every** persona.
2. `~/.pi/agent/personas/<name>/persona.md` — the role definition.
3. `~/.pi/agent/personas/<name>/memory.md` — cross-project working notes, preferences, and accumulated knowledge for this persona.
4. `<cwd>/.personas/<name>/*.md` — the per-project tier. On first adopt in a given working directory the loader auto-creates `<cwd>/.personas/<name>/` and an empty `project.md`, then reads every `*.md` in that directory (sorted alphabetically) and concatenates it verbatim — each file carries its own headings, and empty files contribute nothing (so the auto-created empty `project.md` stays silent until you add content).

It also injects a "Memory Guidelines" footer (verbatim, four bullets) pointing the agent at three paths and instructing it to update the appropriate tier depending on what it has learned:

```text
# Memory Guidelines
- Your cross-project persona memory: `~/.pi/agent/personas/<name>/memory.md`
- Your per-project persona memory: `<cwd>/.personas/<name>/project.md`
- The shared project spec (read by all personas in this project): `<cwd>/AGENT.md`
- **CRITICAL**: If the user explicitly asks you to remember something, corrects you, or you learn something new, you MUST proactively update your memory file using your file editing tools. Durable cross-project learnings go in memory.md; per-project working notes go in project.md; shared project spec changes go in AGENT.md. Do not maintain an achievement log in any persona file — git history is the canonical record of project history.
```

The persona content is **appended** to the system prompt that pi has already built (which includes any `AGENTS.md`/`CLAUDE.md` and `SYSTEM.md`/`APPEND_SYSTEM.md`). It does not replace anything.

The active persona is also **shown in the TUI footer** as `👤 <name> — <title>` when `<name>/persona.md` carries a `## Title:` line (e.g. `👤 Maya — Loader Engineer`), falling back to `👤 <name>` when the line is absent (via `ctx.ui.setStatus("persona", ...)`). The footer row shares the staged prompt's session-local lifetime — it appears on `/become-persona`, swaps with the next `/become-persona`, and disappears on `/reload` (the row is keyed by extension instance).

## Installation

The extension is a single TypeScript file at `~/.pi/agent/extensions/persona-loader.ts`. pi's jiti-based loader picks it up automatically (per `docs/extensions.md:178`); no compilation or `package.json` is required.

To install elsewhere (project-local, or as a git/npm package), see `docs/extensions.md`. The relevant facts:

- `~/.pi/agent/extensions/*.ts` — global
- `.pi/extensions/*.ts` — project-local (gated by project trust)
- `settings.json` `extensions` array — additional arbitrary paths

Reload with `/reload` after moving the file (per `docs/extensions.md:7`).

## Personas directory layout

**Global persona directory** — read on every `/become-persona`:

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

**Per-project tier** — lazily created on first adopt in a given `<cwd>`:

```
<cwd>/.personas/<active persona>/
├── project.md                 # Auto-created empty on first adopt; loader is the sole writer (only on the auto-create, never amended).
└── notes.md                   # Add any *.md files; picked up on the next /become-persona.
```

The loader is the sole writer of `project.md` (and only on the auto-create). Any sibling `*.md` is read on every `/become-persona` invocation. See "Persona file semantics → Per-project tier" below for full semantics.

## Commands

### `/become-persona [name]`

Switch to a persona. With no argument, lists the available personas.

- **Argument completions**: tab-completion iterates the subdirectories of `~/.pi/agent/personas/`, case-insensitive prefix match. Each item carries the persona's `## Title:` line in its `description` field so the dropdown renders `name — title` rows (e.g. `Marcus — Implementation Engineer`). The loader also registers a custom autocomplete provider (via `ctx.ui.addAutocompleteProvider` on `session_start`) so Tab on `/become-persona ` (with or without an argument) fires the dropdown immediately. Without this, pi's built-in routes Tab on slash-command-with-arg to file completion, so the persona dropdown would not appear until the user typed a letter to trigger a natural autocomplete fire.
- **Argument parsing**: surrounding quotes (`'`, `"`, `` ` ``) are stripped before lookup.
- **Behavior on success**: stores the assembled persona content in module-level state (`pendingPersonaPrompt`) and updates the TUI footer to `👤 <name> — <title>` (or `👤 <name>` when no `## Title:` line is present in the persona). A `Switched to persona: <name>` toast is shown. If this is the first adopt in the current working directory, an additional one-time toast reads `Initialised project memory at .personas/<name>/`.
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
- **Session-sticky**: once `/become-persona <name>` is run, the chosen persona is appended on every subsequent `before_agent_start` for the rest of the session. Run `/become-persona <other-name>` to swap personas mid-session; reload the extension (or end the session) to clear.
- Handlers run in extension load order (per `docs/extensions.md:764`); a later extension can still mutate the prompt after this one.

### TUI footer status row

```ts
pi.registerCommand("become-persona", {
  // ...
  handler: async (args, ctx) => {
    // ... after a successful load:
    const title = loadPersonaTitle(cleanName);
    const statusText = title ? `👤 ${cleanName} — ${title}` : `👤 ${cleanName}`;
    if (ctx.hasUI) ctx.ui.setStatus("persona", statusText);
  },
});
```

- The loader owns one footer slot keyed `"persona"`. The slot is updated on every successful `/become-persona` and disappears on `/reload` or end-of-session (the framework releases the key with the extension instance). The status text combines the directory name passed to `/become-persona` with the persona's `## Title:` line, separated by an em-dash — `👤 <name> — <title>`. (`common.md` requires the directory name to equal the `## Name:` field, so the status row's `<name>` half and the persona's identity name never diverge.) When the `## Title:` line is absent or the file is unreadable, the format falls back to `👤 <name>`.
- If you write another extension that wants to extend the footer, pick a different key (`ctx.ui.setStatus("my-ext", ...)`) — cross-extension key collisions silently clobber.
- Print mode (`pi -p`) and JSON mode do not render the footer; the loader guards `setStatus` on `ctx.hasUI` so no-ops are silent.

## Persona file semantics

### `common.md`

Read on every persona switch. Use it for cross-persona conventions: voice, organization principles, where to store facts, how to handle corrections, etc. The Pi persona (this author's) is a good example; it references a "Common Guidance" pattern.

### `persona.md`

The role definition. Re-read on every `/become-persona` call (no caching), so edits take effect on the next switch without reloading the extension. If absent, the loader logs a warning and returns `""` — no persona is applied for that turn.

Convention: keep `persona.md` stable. Role, expertise, tone, and tool usage go here.

### `memory.md`

Optional. Re-read on every `/become-persona` call (no caching), so edits take effect on the next switch without reloading the extension. This is where dynamic state, preferences, and learned facts accumulate. The `memory.md` is expected to be a living document — the "Memory Guidelines" footer (quoted verbatim in "What it does") instructs the agent to update it whenever new facts surface that should travel with the persona across all projects.

### Per-project tier (`<cwd>/.personas/<name>/*.md`)

On the first `/become-persona <name>` invocation in a given working directory, the loader auto-creates `<cwd>/.personas/<name>/` and writes an empty `project.md` there. On every subsequent `/become-persona <name>` (in the same cwd or any other cwd where the directory already exists) every `*.md` file under that directory is read (sorted alphabetically) and concatenated into the prompt verbatim — each file is expected to carry its own headings, and empty files contribute nothing (so the auto-created empty `project.md` is silent until you add content).

**Use it for** notes specific to *this* project that don't belong in the persona's cross-project `memory.md` — architecture notes, project-specific glossary, in-flight decisions, etc.

**Ownership**: the loader is the sole writer of `project.md`, and only on the initial auto-create (it never overwrites or amends that file). You may freely add any number of other `*.md` files alongside it — the loader picks them up automatically on the next `/become-persona`. The "Memory Guidelines" footer tells the agent which kind of fact belongs in `project.md` (per-project) vs. `memory.md` (cross-project) vs. `AGENT.md` (shared spec).

## Module-level state: `pendingPersonaPrompt`

The variable lives at module scope (`persona-loader.ts:7`). Implications:

- **Persists across events** within the same extension instance.
- **Survives `/reload`?** No. The file is re-imported via jiti after `/reload`, so the new instance gets a fresh empty string — you must re-run `/become-persona`. A `~/.pi/agent/.persona-state.json`-backed persistence was considered and rejected for multi-terminal use (a single shared slot would clobber itself across concurrent pi sessions in different terminals).
- **Race condition**: if two `before_agent_start` events fire concurrently (uncommon but possible with parallel agents), they would read the same value. In practice pi processes turns sequentially, so this is theoretical.
- **Session-sticky by design**: the staged prompt is never cleared during the session. The model is "persona is active for the whole session once loaded" rather than "applied to the next turn only."

The TUI footer slot keyed `"persona"` is owned by the loader. If you write another extension, pick a different key (`ctx.ui.setStatus("my-ext", ...)`) — cross-extension key collisions silently clobber.

## Error handling

The whole `loadPersonaContent` body is wrapped in a `try`/`catch`. On any thrown error (filesystem permissions, encoding issues, etc.), the loader:

- Logs to stderr: `[persona-loader] failed to load persona files: <err>`.
- Returns `""`.
- The `/become-persona` handler then notifies `Persona "<name>" not found` (the empty-result branch).

So a corrupted or unreadable persona silently fails to apply. The agent runs without persona content for that turn, with no other side effects.

## Trust and security

This is a **global** extension: it auto-loads on every pi session, in every project, regardless of trust state (per `docs/extensions.md:114` and the `project_trust` ordering at `docs/extensions.md:342`). It:

- Reads from a fixed directory under `$HOME/.pi/agent/personas/`.
- Writes **only** to `<cwd>/.personas/<persona>/project.md` — and only on the first `/become-persona <persona>` in a given working directory (auto-creates the empty file for the per-project tier). After that initial auto-create the loader never overwrites or amends that file; the user owns its contents. No other filesystem writes are performed.
- Has no network, no subprocess, no eval, no shell-out.

The only attack surfaces are the persona markdown files themselves, which become part of the system prompt. Treat `~/.pi/agent/personas/**/persona.md` and `memory.md` with the same trust as `AGENTS.md` — they instruct the LLM with the agent's full tool access. The per-project tier (`<cwd>/.personas/<persona>/*.md`) is in the same trust class: any `*.md` you put there becomes part of the system prompt on subsequent `/become-persona` calls in that cwd.

## Design notes

- **Append, don't replace**: matching pi's `before_agent_start` chaining model. The persona inherits AGENTS.md, CLAUDE.md, SYSTEM.md, and any other extension's contributions.
- **Session-sticky persona**: there is no `agent_end` clear. Once a persona is loaded, it stays loaded until swapped, the session ends, or the extension is reloaded. The trade-off: persona context travels with the agent for the whole session, which is convenient for long tasks but means the user must explicitly switch personas (or reload) to leave a persona.
- **Quoted argument stripping**: the `/become-persona "Foo Bar"` form is supported because users naturally quote multi-word names. The strip is naive — embedded quotes in persona names would break — but no persona name should contain a quote character in practice.
- **`common.md` always read**: it is re-read on every `/become-persona`, so editing it is picked up on the next switch without reloading the extension.

## Customization points

Things you might want to change for your own fork:

- **One-shot persona**: re-add an `agent_end` hook that sets `pendingPersonaPrompt = ""` if you want each turn to require a fresh `/become-persona` invocation.
- **Cross-persona content reuse**: when several personas need the same boilerplate, expose an opt-in `<!-- include: <other-persona> -->` directive in `persona.md` rather than duplicating the text across personas.
- **Persona as a slash command argument**: allow `pi /become-persona Foo "be brief"` style extra instructions appended to the prompt.
- **Hot-reload persona files**: re-read `persona.md`/`memory.md` on every `before_agent_start` rather than only on `/become-persona` (so edits to `memory.md` from inside the agent take effect on the *next* turn without a re-switch).
- **Validation**: fail loudly (e.g. toast) instead of silently returning `""` when `persona.md` is missing.
- **Trust gate**: drop the global scope and move to a project-local `.pi/extensions/persona-loader.ts` if you want it scoped to trusted projects only.

## Limitations and known sharp edges

- **No in-session clear**. Once a persona is active, the only ways to drop it are `/reload`, ending the session, or running `/become-persona <other-name>` to swap. There is no command to explicitly clear.
- **No cross-reload persistence.** A `~/.pi/agent/.persona-state.json`-backed restore was considered and rejected for multi-terminal use — a single shared slot would clobber itself across concurrent pi sessions. The TUI footer row shares the staged prompt's session-local lifetime; both require a fresh `/become-persona` after `/reload`.
- **No argument validation** beyond the quote strip. `../etc/passwd` would resolve to `~/.pi/agent/personas/../etc/passwd` only if a directory of that name existed, which it cannot by construction — `listPersonas` filters to directories and `loadPersonaContent` only reads `persona.md`/`memory.md` from them — but a persona literally named `..` could in principle resolve oddly. In practice, `listPersonas` is the only entry point the user has.
- **`memory.md` content is the persona's view of truth.** Because the extension tells the agent to "proactively update your memory file" on corrections, the memory file can drift. Review it periodically.
- **No concurrency safety** on `pendingPersonaPrompt`. Fine for single-agent use; would need locking for multi-agent setups.
- **The "CRITICAL" memory-update instruction is unconditional.** It is appended on every persona switch regardless of whether the user wants an updateable persona. If you want a read-only persona, you would need to fork the extension to suppress the footer.
- **Conversation-history pattern-match can override a fresh persona in long sessions.** In a long-running session where the user has previously asked the model "Who are you?" under one persona (and the model answered "I am X"), a subsequent `/become-persona Y` correctly stages Y's content but the model can still answer "X" on the next "Who are you?" by pattern-matching the prior conversation over the freshly-staged identity. The loader's mitigation is the `# Active Persona:` banner prepended at the top of every `/become-persona` — it makes the new identity salient. For adversarial cases (very long sessions, repeated "Who are you?" under multiple personas), the user-facing workarounds are `/new` (clear the conversation), `/compact` (summarise away the prior persona answers), or `/reload` (re-stage the persona from scratch).

## Files

| Path | Purpose |
|---|---|
| `persona-loader.ts` | The extension source (this is the single installed file). |
| `persona-loader/README.md` | This document. Co-located per the convention in `common.md` (Single Source of Truth). |
| `~/.pi/agent/personas/common.md` | Shared persona guidelines. |
| `~/.pi/agent/personas/<name>/persona.md` | Per-persona role. |
| `~/.pi/agent/personas/<name>/memory.md` | Per-persona working notes. |

## Source-line index (persona-loader.ts)

(Run `git grep -nE '^(function|const|let|export) ' ~/.pi/agent/extensions/persona-loader.ts` for the live source. The following summary is for orientation only and will rot on the next code change.)

- `pendingPersonaPrompt` declaration
- `loadPersonaContent` (common → persona → memory → project tier → memory-guidelines footer) and the `PersonaLoadResult` return type
- `loadProjectPersonaMemory` (init + read of `<cwd>/.personas/<name>/*.md`)
- `loadPersonaTitle` (reads `<name>/persona.md` for the `## Title:` line)
- `listPersonaCompletions` (autocomplete-item builder; name + title)
- `listPersonas`
- `/become-persona` command registration (description, completions, handler — also calls `ctx.ui.setStatus("persona", ...)` to update the TUI footer)
- `session_start` handler — registers the custom autocomplete provider so Tab on `/become-persona ` fires the persona dropdown immediately
- `before_agent_start` handler (appends to system prompt; session-sticky)

## Source-line index (persona-loader.ts)

Line numbers are approximate (re-derive from source after non-trivial edits):

- `7` — module-level `pendingPersonaPrompt` declaration
- `9-13` — `PersonaLoadResult` interface
- `20-80` — `loadPersonaContent` (common → persona → memory → per-project tier → memory guidelines)
- `82-125` — `loadProjectPersonaMemory` (init + read of `<cwd>/.personas/<name>/*.md`)
- `127-152` — `loadPersonaTitle`
- `154-163` — `listPersonaCompletions`
- `165-175` — `listPersonas`
- `180-237` — `/become-persona` command registration (description, completions, handler)
- `239-269` — `session_start` handler — custom autocomplete provider for Tab-immediate persona list
- `271-280` — `before_agent_start` handler (appends to system prompt; session-sticky)
