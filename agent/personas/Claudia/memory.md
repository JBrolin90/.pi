# Claudia — memory

Per-persona memory for the **Claudia** persona. Cross-project notes
and reusable structure models. Read at the start of each session.
Keep high-signal — link out, don't duplicate.

---

## Multi-agent project structure — STANDARD (remember & apply)

**Remember this. Apply it to every project that will be worked on by
more than one agent (or by the same agent across multiple Pi
sessions).** It isolates agent-facing context from user-facing
artefacts so the two can evolve independently and so concurrent agents
never trample each other. Established 2026-06-28 after restructuring
the sqlcpp POC.

### Layout
```
<project-root>/
├── (build files, source code, README, vendored deps — user-facing)
│   ├── CMakeLists.txt / package.json / …
│   ├── src/ or lib/
│   ├── include/
│   ├── third_party/
│   └── README.md
└── <agent-context-dir>/      # multi-agent context (name is a project choice)
    ├── AGENT.md              # project overview + dated achievement log
    ├── system-design.md      # full design (decisions, architecture, …)
    └── docs/                 # one .md per source file (purpose, API, …)
```

### Concrete instance
- **sqlcpp** (POC, est. 2026-06-28) chose `system_agent/` as the
  `<agent-context-dir>`. Use it as the reference when applying the
  pattern to a new project.

### Conventions
- `<agent-context-dir>/` is the **single source of truth** that a new
  Pi session reads to get up to speed. Launch new sessions with the
  working directory set to `<project-root>/<agent-context-dir>/`.
- **`AGENT.md`** — elevator pitch, scope, tech stack, layout pointer,
  build/run pointer, current maturity, and a **dated achievement log**
  (newest entry at the top). Keep short; link out for detail.
- **`system-design.md`** (or `<project>-design.md`) — the full design:
  decisions and rationale, architecture, component surfaces, data
  model, encoding, errors, build/runtime deps, example session,
  out-of-scope list, open questions.
- **`docs/<source-file-name>.md`** — one reference doc per source file,
  each covering: purpose, public surface, behaviour/algorithm, error
  semantics, dependencies, notes for implementers.
- The user-facing `README.md` lives at the project root and is **not**
  the same as `AGENT.md`.

### Rules of thumb
- Files inside `<agent-context-dir>/` describe *what we're building and
  why*; files at the project root are *what we're building*.
- If a doc is useful to the implementer but not to the end user, it
  belongs in `<agent-context-dir>/docs/`, not at the project root.
- Relative links inside `<agent-context-dir>/` use `./` (siblings);
  references to source code at the project root use `../src/...`,
  `../include/...`, etc.
- When a new agent session starts, the first thing it should do is
  read `AGENT.md` (overview + achievement log) to understand current
  state, then `system-design.md` for the design.

### When to apply
- Any project where multiple Pi sessions (or multiple agents) will
  collaborate.
- Any project where a new agent session needs to get up to speed from
  a cold start (even solo projects benefit from the structure).
- A solo throwaway script does **not** need this structure.
