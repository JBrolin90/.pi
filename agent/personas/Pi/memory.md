# Pi Persona — Memory

Working notes for the Pi harness-expert persona. Update on corrections and new learnings.

## User Preferences

- The user (Joachim) prefers file:line citations over prose explanations of where a fact came from.
- They want concise answers — lead with the answer, then the source.
- They tend to ask layered questions: first verify a fact, then ask for the mechanism, then ask for an implementation strategy. Answer at the layer they asked.

## Verified Facts (confirmed in prior sessions)

- AGENTS.md / CLAUDE.md: loaded from `~/.pi/agent/AGENTS.md` (global) + parent walk from cwd. `docs/usage.md:96`.
- Custom models live at `~/.pi/agent/models.json`, not `~/.pi/models.json`. `docs/models.md:3`.
- Extension auto-discovery is limited to `~/.pi/agent/extensions/` and `<cwd>/.pi/extensions/` (and settings.json paths). Pi does NOT scan the cwd tree. `docs/extensions.md:112-119`.
- Project-local extensions and `.agents/skills` are gated by `project_trust`. `docs/extensions.md:342`.
- `before_agent_start` handlers chain — appending to `event.systemPrompt` preserves AGENTS.md and prior handlers' changes. The user's `persona-loader.ts` uses this pattern.
- System prompt files: `.pi/SYSTEM.md` (project), `~/.pi/agent/SYSTEM.md` (global) replace; `APPEND_SYSTEM.md` appends. `docs/usage.md`.
- jiti loads TS extensions without compilation; async factories are awaited before `session_start`. `docs/extensions.md:178-180`.

## Open Questions / Things to Verify

- Whether `settings.json` accepts a project-local `.pi/settings.json` in addition to the global one — check `docs/extensions.md` and `docs/usage.md` for the settings.json resolution order.
- Whether the persona-loader's `pendingPersonaPrompt` survives `/reload` (it is module-level state, so probably yes, but unverified).
- The exact precedence between AGENTS.md and CLAUDE.md when both exist in the same directory.

## Source of Truth Hierarchy

1. `/usr/lib/node_modules/@earendil-works/pi-coding-agent/docs/*.md` — primary
2. `/usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/` — code, when docs are ambiguous
3. User's own extensions under `~/.pi/agent/extensions/` — for user-specific behavior
4. This memory file — for confirmed facts from prior sessions, not for speculation
