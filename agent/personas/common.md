# Common Guidance

Shared principles for all personas.

## Information Organization

- **Single Source of Truth**: Keep configuration and facts in their authoritative source (config files, architecture docs). Don't duplicate.
- **Reference Over Copy**: When a fact exists in a config file or doc, reference the path rather than copying the data.
- **Doc Purpose**: Architecture docs describe structure and intent. Dynamic or operational state goes in the persona's per-persona memory file at `personas/<persona>/memory.md` (see *Memory System* below).
- **Memory.md (per-persona)**: Each persona has its own memory file at `personas/<persona>/memory.md`. It stores personal context, preferences, dynamic state, and working knowledge that evolves. This is **not** a single shared file at the agent-home root (e.g. `~/.pi/agent/memory.md`) — that location is reserved for shared, persona-neutral content.
- **When Corrected**: Update the relevant document in place. Replace outdated info, don't just append.

## Memory System (per-persona)

Each persona keeps its own memory file at `/home/joachim/.pi/agent/personas/<persona>/memory.md`
(it is **not** a single shared file at the agent-home root — that path
is reserved for shared, persona-neutral content). When I learn
something new or am corrected, update the appropriate file:
- Personal preferences, location, relationships → memory.md (Personal section)
- Voice/tone corrections → memory.md (Voice section)
- Task process improvements → memory.md (Process section)
- Infrastructure facts → architecture docs or config files
- People and relationships → memory.md (People section)

## Project Memory

Two tiers of persona memory, plus a shared project spec. **Git is the
source of truth for project history** (commits, PR descriptions, tags).
Personas do not maintain an achievement log in any file — git is
canonical for history, and persona files are for *current* state, not
historical record.

### The two persona memory tiers

| Tier                  | Path                                                  | Purpose                                                                                              | Read by            | Written by       |
|-----------------------|-------------------------------------------------------|------------------------------------------------------------------------------------------------------|--------------------|------------------|
| Cross-project persona | `~/.pi/agent/personas/<persona>/memory.md`            | Durable persona learnings — voice, preferences, conventions that apply across all projects. May include project-specific subsections for one-off learnings. | This persona only | This persona only |
| Per-project persona   | `<cwd>/.personas/<active persona>/project.md`         | Per-project working notes for the active persona in the current cwd. The persona-loader auto-creates the directory and an empty `project.md` on first adopt. | This persona only (via persona-loader) | This persona only |

### The shared project spec — `<cwd>/AGENT.md`

`<cwd>/AGENT.md` is the project's **main spec**, read by every persona
working on this project (pi loads it automatically via `AGENTS.md` /
context-file discovery from the cwd). Contents:

- A short project overview (what it is, tech stack, repo layout)
- A pointer to the full design (e.g. `system-design.md`) and any
  per-component reference docs
- A maturity / next-milestone note so the next session knows where to
  pick up

**No achievement log.** Do not maintain a dated achievement log in
`AGENT.md` — git history (`git log`, PR descriptions, releases) is the
canonical record of what changed and when. `AGENT.md` is for the
*current* state of the project, not its historical record.

When you genuinely need to record a project-level fact that future
personas should also know (a non-obvious design constraint, an
established convention everyone must follow), put it in the *spec*
sections of `AGENT.md`, not in a "log". If it's not in the spec, it's
not load-bearing; git history is enough.

### Distinction in one sentence

- `personas/<persona>/memory.md` = **who I am** — durable,
  cross-project persona learnings.
- `<cwd>/.personas/<active persona>/project.md` = **what I'm working
  on for this project** — per-project persona working notes (current
  state, in-flight decisions, project-only conventions).
  Loader-managed; empty by default.
- `<cwd>/AGENT.md` = **what this project is** — shared spec, loaded
  by every persona, owned by no one in particular.

## Behavior

- If in doubt, never guess but ask the user instead

### After each agentic loop
- Reflect on whether anything new belongs in `<persona>/memory.md`
  (durable, cross-project learnings), `<cwd>/.personas/<active
  persona>/project.md` (per-project working notes), or `<cwd>/AGENT.md`
  (shared spec change).
- Write to the **narrowest** tier that fits; promote to a wider tier
  later if the fact turns out to be shared.
- **Do not maintain an achievement log in any persona file** — git
  history is the canonical record of what changed and when.
- Keep all persona files succinct and razor-sharp.
