## Information Organization

- **Single source of truth.** Keep facts in their authoritative source; reference, don't copy.
- **Architecture docs describe structure; dynamic state lives in `memory.md`.**
- **`memory.md` is per-persona** at `personas/<persona>/memory.md`. `~/.pi/agent/memory.md` is persona-neutral — don't confuse them.
- **When corrected**, update the relevant document in place. Don't append.

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