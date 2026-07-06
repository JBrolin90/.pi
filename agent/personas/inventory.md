# Persona Inventory

Authoritative list of every persona on disk at `~/.pi/agent/personas/<name>/`.
Maintained by **Ada** (the persona specialist) on every add / modify / remove.
This file is loader-agnostic — the persona-loader does not read it; it exists
for human readers and for cross-references between personas. Reference it
from `Ada/persona.md` and `common.md` so the agent picks it up on
`/become-persona`.

The two metadata fields `## Name:` and `## Title:` in each `persona.md` (see
`Ada/persona.md` § *Structural Conventions → The Name and Title fields*)
are the canonical name and title for each persona. The contract requires
`## Name:` to equal the directory name; the *Directory* column below
records the loader's runtime identifier, which is the same value.

## The Inventory

| Name    | Title                   | Directory   | H1                                         | Has `memory.md`? | Extra files                                          | Last touched |
|---------|-------------------------|-------------|--------------------------------------------|------------------|------------------------------------------------------|--------------|
| Ada     | Persona Architect       | `Ada/`      | Persona Specialist Role                    | yes              | none                                                 | 2026-07-03   |
| Alan    | Sysadmin                | `Alan/`     | System Administrator Role                  | yes              | `homelab_architecture.md`, `SinceraHemserviceAB.txt` | 2026-07-03   |
| Theo    | Org Designer            | `Theo/`     | Team & Organization Builder                | yes              | none                                                 | 2026-07-03   |
| Maya    | Loader Engineer         | `Maya/`     | Persona Loader Maintainer                  | yes              | none                                                 | 2026-07-03   |
| Sue     | Python Developer        | `Sue/`      | Senior Python Developer Role               | yes              | none                                                 | 2026-07-03   |
| Stella  | Purchase Researcher     | `Stella/`   | Purchase Research Specialist               | yes              | none                                                 | 2026-07-06   |
| Hazel   | Smart Home              | `Hazel/`    | Home Assistant Expert Role                 | yes              | none                                                 | 2026-07-03   |
| Vera    | Test Engineer           | `Vera/`     | Verification & Test Engineer               | yes              | none                                                 | 2026-07-03   |
| Idun    | LLM Steward             | `Idun/`     | Local LLM Connections Steward              | yes              | none                                                 | 2026-07-03   |
| Marcus  | Implementation Engineer | `Marcus/`   | Lead Implementation Engineer               | yes              | none                                                 | 2026-07-03   |
| Claudia | System Architect        | `Claudia/`  | System Design Specialist                   | yes              | none                                                 | 2026-07-03   |
| Linnea  | Bookkeeper              | `Linnea/`   | Swedish Document Classification Specialist | yes              | none                                                 | 2026-07-03   |
| Diane   | Executive Assistant     | `Diane/`    | Executive Assistant Role                   | yes (empty body) | none                                                 | 2026-07-03   |

**Notes:**

- *Last touched* is the date the persona's `persona.md` or `memory.md` was
  last modified by Ada on Joachim's request. Mechanical edits Ada makes
  on her own initiative (e.g. updating the cross-reference in this file)
  are not counted.
- 2026-07-03 in every row reflects the `## Name` + `## Title` addition
  in this session. Specific per-persona edits in the same session are
  called out in `Ada/memory.md` → *Change log*.

**Removed:**

- **Pi** — 2026-07-03 — removed by Joachim's request. Covered the pi
  coding-agent harness (extension host API, system-prompt composition,
  jiti behaviour, project-trust gating). Cross-references in Maya's
  `persona.md` and `memory.md` that routed to "the Pi persona" are
  now dangling; see `Ada/memory.md` → *Known Issues* for the
  resolution options.

## Maintenance

- **Add a persona**: append a new row in the same order (Ada first, then
  alphabetically by Directory). Add a one-line change-log entry to
  `Ada/memory.md`.
- **Modify a persona**: edit the changed columns in place; move the
  *Last touched* date forward.
- **Remove a persona**: prepend a "REMOVED" line under the **Removed**
  heading; do not delete the original row. The row stays visible for
  historical reference.

This file is the source of truth for "what personas exist". It
supersedes the inventory table that used to live in `Ada/memory.md` →
*Persona Inventory* (now a one-line reference back to this file, per
`common.md` § *Information Organization* → "Reference Over Copy").
