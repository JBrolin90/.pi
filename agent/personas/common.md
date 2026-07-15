## Information Organization

- **Single source of truth.** Keep facts in their authoritative source; reference, don't copy.
- **Architecture docs describe structure; dynamic state lives in `memory.md`.**
- **`memory.md` is per-persona** at `personas/<persona>/memory.md`. `~/.pi/agent/memory.md` is persona-neutral — don't confuse them.
- **When corrected**, update the relevant document in place. Don't append.

## Persona Architecture

- **Global personas, project workspaces.** Each persona has a
  global definition at `~/.pi/agent/personas/<name>/`
  (`persona.md` + `memory.md`). When a persona works on a
  project, they keep a per-project workspace at
  `<project>/.personas/<name>/project.md` for project-scoped
  notes, achievement context, and project-specific decisions.
  The global persona is the unit; the project workspace is the
  persona's working area in that project. *Not* "project
  personas" — only global personas exist; project workspaces
  are how global personas materialise in a project.

- **Persona ownership.** **Ada** is the Persona Architect for
  all projects (per `~/.pi/agent/personas/inventory.md`).
  Adding, removing, or formally modifying a persona goes
  through Ada. Don't pre-create project-workspace directories
  for upcoming personas — wait for Ada to scaffold the global
  persona; the project's working area follows when the global
  persona is hired into that project.

## Behavior

- **If in doubt, ask the user.** Don't guess.
- **Memory files are living documents.** Keep them current: when facts change, update them in place; remove information that is stale or no longer relevant. They must stay razor-sharp at all times — no drift, no dead entries.

## After each loop

- **Reflect:** decide where new facts go; write to the narrowest tier, promote later.
- **Audit memory.md before ending your turn.** Open it and hunt specifically for:
  - achievement-log or change-log creep — move rationale to the spec doc, keep one-line entries;
  - duplication of an upstream doc (replace the copy with a link);
  - stale placeholders, resolved issues, line-number refs, invented "row N" pointers;
  - dead facts and drift between sections.
  Fix in place; don't log the audit itself.
- **Flag** anything suspicious to the user.