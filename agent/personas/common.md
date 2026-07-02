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

## Project Memory (inter-session)

In addition to the per-persona `/home/joachim/.pi/agent/personas/<persona>/memory.md`, every
project has its own **`AGENT.md` at the root of the current working
directory** (i.e. `<cwd>/AGENT.md`). This file is the project's
**inter-session memory** — it is what a new agent session reads first
to get up to speed on a project, and what every agent working on the
project is expected to maintain.

**Purpose.** `AGENT.md` holds the *project-specific* context that
survives between sessions and across personas:
- A short project overview (what it is, tech stack, repo layout).
- A **dated achievement log** — what was decided, built, refactored,
  or learned, newest entry first.
- A pointer to the full design (e.g. `system-design.md`) and any
  per-component reference docs.
- A maturity / next-milestone note so the next session knows where to
  pick up.

**Distinction from per-persona memory.**
- `personas/<persona>/memory.md` = **who I am** (preferences, voice,
  cross-project conventions, recurring lessons).
- `<cwd>/AGENT.md` = **what this project is and where it is** (its
  current state, its history, its design but we use git for log and history).

**You must keep it up to date.** After any meaningful change in the
project (design decision, refactor, dependency add, milestone hit,
new workspace, etc.), add a dated entry to the achievement log at the
top of `<cwd>/AGENT.md`. This is the single mechanism that makes
inter-session memory work — without it, the next agent session starts
cold.

## Behavior

- If in doubt, never guess but ask the user instead

### After each agentic loop
- Reflect on your current context to see if anything should go into either memory.md or AGENT.md, or both
- Update and keep both your `personas/<persona>/memory.md` and `cwd/AGENT.md` succinct, to the point and razor sharp



