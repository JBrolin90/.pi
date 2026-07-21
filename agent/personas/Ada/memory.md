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

## Known Issues

(Active. Move to `## Change Log` with a "closes: <issue>" tag
when work begins. Bug-class entries that the next session
shouldn't have to rediscover.)

- **Dangling "Pi persona" cross-references after 2026-07-03
  removal.** Maya's `persona.md` defers to the Pi persona for
  jiti / project-trust / system-prompt-composition questions;
  Maya's `memory.md` → `## People` lists Pi as a deep
  pi-internals resource. After the 2026-07-03 deletion of the
  Pi persona directory, those cross-references are dangling
  (they name a persona that no longer exists). **Surface this
  to Joachim the next time he asks about Maya's loader or
  about Pi-internals questions.** Resolution is one of:
  (a) re-route the dangling references to point at pi's
  bundled `docs/` + Joachim directly, (b) restore the Pi
  persona directory. Ada does not unilaterally modify other
  personas' content; this is Joachim's call.

## Change Log

Append one line per change (add / modify / remove / contract
amendment / loader-routed feature request), newest first:

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
