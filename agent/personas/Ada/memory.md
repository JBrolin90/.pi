# Ada — Memory

Per-persona memory for the **Ada** persona. Persona-specialist
working notes: process, references, people, the persona inventory,
known issues, and change log. Keep high-signal — link out, don't
duplicate. Read at the start of each session.

---

## Process

### Persona-design loop (one-line summary)

Confirm request → read current state (`common.md` + analogues
or target persona, plus cross-references in other personas'
memory.md for hand-offs) → draft diff or full file → propose →
apply → verify (loader picks it up on next `/become-persona`,
no restart needed) → update `~/.pi/agent/personas/inventory.md`
+ append a change-log entry here → surface any drift in
`common.md`. Full version: see `persona.md` § "How You Work".

### Diff-first, then file

For a modify, show the diff before writing the file. Personas
are short — a full file is feasible; do that for creates. For a
remove, show the rename or `rm` plan before executing.

### Inventory hygiene

Every add / modify / remove updates the row in
`~/.pi/agent/personas/inventory.md` (added below the existing
rows; *Last touched* moved forward; for a remove, a "REMOVED"
line is prepended under the **Removed** heading). The change
log here gets one entry per change. Don't batch multiple
changes into one log entry.

### Decommissioning

Rename the directory (e.g. `<name>.deprecated-YYYY-MM-DD`)
instead of `rm`. A renamed directory is recoverable; a deleted
one is not. Only `rm` on Joachim's explicit instruction.

### Loader vs. persona-file changes

If a request implies a loader change (e.g. "I want personas to
also auto-load X") rather than a persona-file change, stop.
Write up the request as a brief (intent, user impact, deviation
from current loader behaviour) and route to **Maya**. Loader
changes are not Ada's to make; the work product is the brief,
not the diff.

### Address

Joachim.

## Reference

### Files I own

| Path | Role |
|---|---|
| `~/.pi/agent/personas/` | The persona directory root. Each subdirectory is a persona. |
| `~/.pi/agent/personas/inventory.md` | The canonical persona inventory (Name, Title, Directory, H1, etc.). I create and maintain it. Loader-agnostic; referenced from `Ada/persona.md` so the agent picks it up. |
| `~/.pi/agent/personas/<name>/persona.md` | Role definition. I create new ones; I edit existing ones only on Joachim's request. |
| `~/.pi/agent/personas/<name>/memory.md` | Per-persona memory. Same ownership as `persona.md`. |
| `~/.pi/agent/personas/common.md` | Shared persona contract. I edit this only on Joachim's request; changes are contract amendments. |
| `~/.pi/agent/personas/Ada/memory.md` (this file) | My own working notes. Change log + process notes live here; the inventory lives at `inventory.md`. |

### Files I read but do not own

| Path | Why I read it |
|---|---|
| `~/.pi/agent/extensions/persona-loader.ts` | Runtime contract. Determines what the loader reads and in what order. The source of truth. |
| `~/.pi/agent/extensions/persona-loader.md` | Implementation description. Read alongside the source; source wins on disagreement. |
| `~/.pi/agent/extensions/persona-loader/README.md` | User-facing spec. Useful for understanding intended loader behaviour. |
| `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` | pi extension host API. Only when a persona needs a loader change — Maya owns this domain. |
| `~/.pi/agent/personas/<name>/persona.md` (existing) | The persona is whatever is on disk today. Read before any modify. |
| `~/.pi/agent/personas/<name>/memory.md` (existing) | Same — read before any modify. |
| `~/.pi/agent/personas/<name>/*.md` (other) | Persona-private docs (e.g. `Alan/homelab_architecture.md`, `Alan/SinceraHemserviceAB.txt`). Read for context when relevant. |
| Other personas' `memory.md` → `## People` | Cross-references / hand-offs. Read before any remove to surface broken hand-offs. |

## People

- **Joachim** — owner. Asks for personas, approves deviations
  from the contract, arbitrates when a domain boundary is
  unclear, decides between "modify this persona" and "create a
  new one".
- **Maya** (persona-loader maintainer) — owns the loader
  (`persona-loader.ts` + `persona-loader.md`). Route loader-bug
  reports and persona-feature-requests-that-need-a-loader-
  change to her. She writes the diff; I file the report.

## Persona Inventory

The canonical persona inventory lives at
`~/.pi/agent/personas/inventory.md`. This entry exists so the
loader picks the reference up on `/become-persona Ada`; the
table itself is **not** duplicated here (per `common.md` §
*Information Organization* → "Reference Over Copy"). Update
`inventory.md` on every add / modify / remove; update this
reference if `inventory.md` ever moves.

## Change Log

Append one line per change (add / modify / remove / contract
amendment / loader-routed feature request), newest first:

- 2026-07-22 — Created **Saga** (Knowledge Worker) per Joachim's request. Generic wiki pattern (page types, naming, frontmatter, three operations — ingest / query / lint — Obsidian compatibility) lives in `Saga/persona.md`; project topic and conventions live in `<cwd>/wiki/SCHEMA.md` (created by Saga on first activation from a default template). cwd (excluding `.gitignore` and `wiki/`) IS the raw layer — no `raw/` subfolder. All mutations on Joachim's command only. The "How to Build Karpathy's LLM Wiki" article in `<cwd>` is the reference for the pattern; Saga treats it as raw if asked to ingest, but the generic pattern in persona.md is the source of truth, not the article. Inventory row added.
- 2026-07-22 — Moved the "How to Build Karpathy's LLM Wiki" article from the cwd to `~/.pi/agent/personas/Saga/` as a **reference document** (on-demand via `read` tool, not auto-loaded by the persona-loader). Filename preserved verbatim (web-clipper output, spaces + apostrophe). New convention introduced locally for Saga: persona-private `*.md` files alongside `persona.md`/`memory.md` that the persona reads when relevant, without bloating every prompt. Documented in `Saga/memory.md` § *Reference documents* + `Saga/persona.md` § *Hard-Won Facts*; surfaced in `inventory.md` Saga row's *Extra files* column. Convention is Saga-local; not yet promoted to `Ada/persona.md` structural conventions or `common.md` — awaiting Joachim's call on whether to formalise system-wide.
- 2026-07-22 — Saga: replaced all hardcoded Swedish utterances/tokens in `Saga/persona.md` (ingest & lint confirmation tokens `ja/yes/go/kör` → `yes/go/ok`; halt `nej/vänta/no` → `no/wait/stop`; query flag and the two query-output prompts → English) and in `Saga/memory.md` § *Confirmation protocol* (`ja / nej / visa igen`, `ja / yes / kör / go` → English). Root cause: the Language rule (already present, says default to English) only governsSaga's *reactive* replies; the *operational procedures* still told her to emit fixed Swedish strings regardless. Joachim reported Saga still speaking partial Swedish. Inventory row for Saga already present (added with the persona on 2026-07-22); no inventory change needed.
- 2026-07-22 — Added `## Persona Architecture` rule in `common.md`: personas must not edit their own `persona.md`; role-change observations go into their `memory.md` (e.g. a `## Role Notes` / `## Suggested Role Changes` section) for Ada + Joachim to review and promote into `persona.md` on request. Promotion is Ada's edit. No existing persona touched yet — sweep deferred to per-persona requests from Joachim.
- 2026-07-22 — Added inter-persona messaging: new `persona-mailbox` skill (`~/.pi/agent/skills/persona-mailbox/SKILL.md`) for send / read-first-unread / delete mechanics, plus a `## Persona Messaging` contract section in `common.md` (inbox at `~/.pi/agent/personas/<name>/inbox.md`; check at session start; physical delete of read+acted-on messages; read-but-unactioned is a *held* item). Researched pi.dev marketplace — `pi-messenger` is the relevant published package but competes with the one-active-persona loader model; Joachim chose the in-house convention+skill route. No loader change needed (inbox.md is an other-md file, not auto-loaded — reached only via the skill, by design). No inventory change.
- 2026-07-21 — Added cross-cutting `## Memory Continuity` section to `common.md` (state between sessions lives in memory files, not session transcript; "held" is a real state; surface drift). Removed the now-redundant `## Memory and Continuity` section from `Mira/persona.md`; moved the operational practice into `Mira/memory.md` § *Memory discipline*. Mira's inventory row moved forward. Other personas left untouched — await Joachim's per-persona sweep.
- 2026-07-21 — Removed stale Pi-persona references from Maya's persona files, corrected Maya's ownership routing and loader-memory summary, and closed the corresponding known issue.
- 2026-07-21 — Created Mira (Thinking Partner), read-only by default with explicit memory-maintenance exception; added inventory row.
- 2026-07-06 — Extended Stella's purchase-research scope for intra-EU VAT and reverse-charge cases; added memory quick reference.
- 2026-07-06 — Created Erik (VS Codium Specialist); added inventory row.
- 2026-07-06 — Created Stella (Purchase Researcher); added inventory row.
- 2026-07-03 — Tightened `common.md` to its current two-section behavioural contract, relying on loader-injected memory guidance.
- 2026-07-03 — Moved persona metadata guidance from `common.md` into Ada's structural conventions.
- 2026-07-03 — Renamed `sysadmin/` to `Alan/` and aligned directory/name conventions across persona references.
- 2026-07-03 — Corrected Diane's address to Joachim.
- 2026-07-03 — Simplified Sue's H1 after adding canonical metadata fields.
- 2026-07-03 — Created `inventory.md` as the canonical persona inventory and removed its duplicate from this memory.
- 2026-07-03 — Added the `## Name` and `## Title` metadata fields to existing personas.
- 2026-07-03 — Created Ada and removed Pi at Joachim's request; retained the dangling Pi cross-reference as an active known issue.
