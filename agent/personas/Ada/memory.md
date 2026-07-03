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
| `~/.pi/agent/personas/inventory.md` | The canonical persona inventory (Name, Title, Directory, H1, etc.). I create and maintain it. Loader-agnostic; referenced from `Ada/persona.md` and from `common.md` so the agent picks it up. |
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

**Removed (history):**

- **Pi** — 2026-07-03 — removed by Joachim's request. Persona
  covered the pi coding-agent harness (extension host API,
  system-prompt composition, jiti behaviour, project-trust
  gating). Cross-references in other personas' memory files
  that routed to "the Pi persona" are now dangling; flagged
  in `## Known Issues` and at the time of removal. The
  historical row also lives in `inventory.md` → *Removed*.

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

- **Address rule is implicit, not contractually pinned.**
  `common.md` does not explicitly state which name a persona
  should use when addressing the user. The inventory
  consistently uses `Joachim` (with Diane as the lone
  deviation). A one-line addition to `common.md` could make
  this a hard rule, but it is a contract amendment and
  requires Joachim's sign-off.

## Change Log

Append one line per change (add / modify / remove / contract
amendment / loader-routed feature request), newest first:

```
- YYYY-MM-DD — <one-line summary>.
```

- 2026-07-03 — Tightened `common.md` to pure, succinct instructions on Joachim's request. Discovered that the persona-loader at `persona-loader.ts:60-67` already injects a "Memory Guidelines" footer into every persona's prompt with the three memory tiers and the "no achievement log" rule, so the entire `## Memory System (per-persona)` and `## Project Memory` sections of `common.md` were duplicate of loader-injected content (the "no achievement log" rule was repeated four times). Rewrote `common.md` from 87 → 16 lines: two sections (`## Information Organization` + `## Behavior`), 8 directive bullets, one meta-note pointing the maintainer at the loader's injection. Cross-references updated: `Ada/persona.md` line 26 (Memory tier model now points at `persona-loader.ts:60-67`), `Ada/persona.md` lines 122–127 (`### common.md` convention section updated to new 2-section structure), `Ada/persona.md` line 160 (cross-reference example changed from `common.md § Memory System` to `common.md § Information Organization`). `inventory.md:66` reference to `common.md § *Information Organization*` still works.
- 2026-07-03 — Moved the `## Persona Metadata` section out of `common.md` on Joachim's request. It was documentation about the persona system (loader-agnostic Name/Title fields, inventory pointer), not behavioural guidance — `common.md` is loaded with every persona and should hold only instructions. Content moved to a new sub-section `### The Name and Title fields` under `## Structural Conventions` in `Ada/persona.md`. Cross-references updated: the inline bullet at `Ada/persona.md` line 80 (in the `### personas/<name>/persona.md` numbered list) and the intro paragraph in `inventory.md`. Historical change log entries that referenced the old `common.md § *Persona Metadata*` location are kept verbatim — they describe state at the time.
- 2026-07-03 — Renamed the `sysadmin/` directory to `Alan/` and codified the rule "directory name == `## Name:` field" in `common.md` § *Persona Metadata* + Ada's Structural Conventions on Joachim's request. The previous `sysadmin/` → Alan discrepancy is resolved; the new rule has no exceptions. Updated `inventory.md` (Directory column + intro note), `persona-loader/README.md` (removed the exception sentence), `Maya/memory.md` (resolved the prior "👤 sysadmin — Sysadmin" surface item), and the prose references in `Idun/persona.md` + `Idun/memory.md` (8 occurrences of "sysadmin" → "Alan"). No loader source change — the loader uses `listPersonas()` dynamically and picks up the rename automatically.
- 2026-07-03 — Fixed Diane's address from `Carl` to `Joachim` on Joachim's request. Removed the corresponding `## Known Issues` entry. (Resolved 2026-07-03 issue #2.)
- 2026-07-03 — Fixed Sue's H1: removed redundant `(Sue)`. The `## Name:` field added in the prior session is the canonical name anchor; the H1 now reads `# Senior Python Developer Role`.
- 2026-07-03 — Created `~/.pi/agent/personas/inventory.md` as the canonical persona inventory (Name, Title, Directory, H1, etc.) on Joachim's request. Removed the duplicate inventory table from this file (per *Reference Over Copy*); kept a one-line reference. Added the file to Ada's "Files I own" table. Referenced `inventory.md` from `common.md` § *Persona Metadata*.
- 2026-07-03 — Amended `common.md` to add `## Persona Metadata` section (Name + Title convention) and updated Ada's `Structural Conventions` to require the two new H2 fields. Joachim-approved. Both fields are loader-agnostic; the loader continues to use the directory name as the runtime identifier. The `sysadmin/` → Alan discrepancy is the one documented exception to the directory-name = identity-name default.
- 2026-07-03 — Added `## Name` + `## Title` fields to every persona's `persona.md` on Joachim's request. One edit per persona, 12 personas, minimal diff (inserted between H1 and identity paragraph). Titles assigned: Ada→Persona Architect, Claudia→System Architect, Diane→Executive Assistant, Hazel→Smart Home, Idun→LLM Steward, Linnea→Bookkeeper, Marcus→Implementation Engineer, Maya→Loader Engineer, Sue→Python Developer, sysadmin→Sysadmin, Theo→Org Designer, Vera→Test Engineer. The Name field uses the persona's identity name (e.g. `Alan` for the `sysadmin` directory), not the directory name — flagged in `## Known Issues` for the common.md implication. No `common.md` changes yet.
- 2026-07-03 — Created Ada persona (this file). Deleted Pi
  persona directory on Joachim's request; flagged the
  resulting dangling "Pi persona" cross-references in Maya's
  `persona.md` + `memory.md` (see `## Known Issues`). Wrote
  the Ada `persona.md` first (read every existing persona
  and the loader source); then populated this memory file
  with the initial inventory and the change-log entry. No
  `common.md` changes. No loader changes.
