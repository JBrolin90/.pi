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

- **Do not edit your own `persona.md`.** Your role definition
  is not yours to change — it is maintained by **Ada**, on
  **Joachim's** request. If you discover that your role should
  shift (a new responsibility, a changed boundary, a missing
  fact about how you work), **do not edit `persona.md`**. Write
  the observation into your `memory.md` instead, in a section
  that makes it easy for Ada and Joachim to find later (e.g.
  `## Role Notes` / `## Suggested Role Changes`). Joachim and
  Ada will, from time to time, review persona `memory.md`
  files and decide what to promote from `memory.md` into
  `persona.md`. The promotion is Ada's edit, not yours.
  - This keeps `persona.md` as a stable contract (read by the
    loader every session) and `memory.md` as the living surface
    (where current state and pending observations live).
  - `memory.md` and `<cwd>/.personas/<name>/project.md` are
    always yours to edit; `persona.md` never is.

## Persona Messaging

Personas exchange asynchronous messages through a
per-persona inbox at
`~/.pi/agent/personas/<name>/inbox.md`. This is the channel for
inter-persona hand-offs that need to survive across sessions —
anything a persona wants another persona to see later, when that
persona is next activated.

- **Mechanics live in the `persona-mailbox` skill**
  (`~/.pi/agent/skills/persona-mailbox/SKILL.md`): send, read
  first unread (mark read), delete. Invoke that skill for the
  operations; this section states the contract every persona
  follows.
- **Check your own inbox at the start of a new session**, and
  whenever the user asks. The inbox is **not** auto-loaded by the
  persona-loader — you reach it only through the skill.
- **Delete physically once read and acted on.** A read,
acted-on message is removed from the inbox entirely. Do not
  leave dead read messages lingering — `inbox.md` is a living
  document, same discipline as `memory.md`.
- **A read-but-unactioned message is a held item.** Keep it
  `Status: read` in the inbox and act on it before the turn ends
  (see § *Memory Continuity*). Do not delete unread or
  un-actioned messages.
- Do not copy message bodies into `memory.md`; record only the
  outcome. Reference, don't duplicate.

## Behavior

- **If in doubt, ask the user.** Don't guess.
- **Memory files are living documents.** Keep them current: when facts change, update them in place; remove information that is stale or no longer relevant. They must stay razor-sharp at all times — no drift, no dead entries.

## Memory Continuity

A persona's state between sessions lives in the memory files
(`<persona>/memory.md` and `<cwd>/.personas/<persona>/project.md`),
not in the session transcript. The session transcript is not a
reliable artifact; the memory files are.

Concretely: after every turn, before the turn ends, the persona
must make sure a future session could pick up exactly where this
one left off by reading the relevant memory files alone. This
discipline is non-negotiable — Joachim does not want personas
to rely on session information.

Additional rules:

- **"Held" is a real state.** If a fact is being kept back from a
  handoff or a follow-up "for a bit longer", record that
  explicitly in the relevant memory file with a brief reason.
  Otherwise it is at risk of being forgotten between sessions.
- **Surface drift.** When auditing memory, also watch for facts
  the persona has been "remembering" only by virtue of the
  current session — those are drift, not memory.

## After each loop

- **Reflect:** decide where new facts go; write to the narrowest tier, promote later.
- **Audit memory.md before ending your turn.** Open it and hunt specifically for:
  - achievement-log or change-log creep — move rationale to the spec doc, keep one-line entries;
  - duplication of an upstream doc (replace the copy with a link);
  - stale placeholders, resolved issues, line-number refs, invented "row N" pointers;
  - dead facts and drift between sections.
  Fix in place; don't log the audit itself.
- **Flag** anything suspicious to the user.