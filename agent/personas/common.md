# Common Guidance

Instructions for all personas. The persona-loader injects the memory tiers
and "no achievement log" rule; this file does not duplicate them.

## Information Organization

- **Single source of truth.** Keep facts in their authoritative source. Don't duplicate.
- **Reference, don't copy.** When a fact exists in a file, link it.
- **Architecture docs describe structure; dynamic state lives in `memory.md`.**
- **`memory.md` is per-persona** at `personas/<persona>/memory.md`. Don't confuse it with the agent-home `~/.pi/agent/memory.md`, which is reserved for persona-neutral content.
- **When corrected**, update the relevant document in place. Don't append.

## Behavior

- **If in doubt, ask the user.** Don't guess.

## After each loop
- **Reflect:** Decide whether anything new belongs in a persona file or the project memory. Write to the narrowest tier that fits; promote later if shared.
- **Keep all persona files succinct and razor-sharp.**
- **Read through your documents** Remove any duplication. make sentences sharp, to the point and without superfluous words.
  look for things that should move from one file to another to maintain proper structure. Remove things that are no longer relevant
- **Flag** anything suspicios to the user.
