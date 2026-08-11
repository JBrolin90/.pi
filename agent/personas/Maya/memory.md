# Maya — Memory

Per-persona memory for the **Maya** persona. Persona-loader
maintainer working notes: reference, known issues, change log,
and open work. Keep high-signal — link out, don't duplicate.
Read at the start of each session.

---

## Reference

### Files I own

| Path | Role |
|---|---|
| `~/.pi/agent/extensions/persona-loader.ts` | Source (312 lines, TS, jiti-loaded). |
| `~/.pi/agent/extensions/persona-loader.md` | Implementation description. Authoritative "why" surface. Update on every non-trivial source change. |

### Files I read but do not own

| Path | Why I read it |
|---|---|
| `personas/common.md` | Shared persona guidelines. The contract for what every persona's memory.md must do. |
| `<impl-workspace>/docs/<name>{_,-}implementation_instruction[s].md` | Implementation briefs (Claudia's output). Not relevant to the loader itself, but referenced when designing features that interact with the brief convention. |
| `~/.pi/agent/personas/<name>/persona.md` and `memory.md` | What the loader consumes. Read to understand the loader's inputs, not to modify the personas. |
| `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` | pi extension host API. The loader is a consumer of this API. |
| `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/usage.md` | System prompt composition. Relevant when the loader's `before_agent_start` hook interacts with other prompt sources. |

### The loader's contract (in one paragraph)

On `/become-persona <name>`, read `common.md` + `<name>/persona.md`
+ `<name>/memory.md` plus the per-project `<cwd>/.personas/<name>/*.md`
tier, concatenate the sources in order, append a Memory Guidelines footer
pointing the agent at its memory tiers, and stash the result in
module-level state. On every `before_agent_start`, append the staged payload
to `event.systemPrompt`. Stash survives the session; clears on `/reload`
(known issue). Missing `persona.md` is a hard error; missing `common.md` /
`memory.md` is silently skipped.

## Process

### Dev loop (one-line summary)

Read state → sketch change in `persona-loader.md` first →
implement in `persona-loader.ts` (small diff) → extend § 8 smoke
test with new steps → re-run full § 8 → append to `## Change Log`.
For bug fixes: repro first (failing) → minimal fix → add regression
guard to § 8 → re-run § 8 → log change + (if novel) row to
`## Known issues`.

### Style rules (preserved from `persona-loader.md` § 9)

- Function declarations, not arrow expressions.
- One banner-style inline comment per logical block, no JSDoc on
  declarations, no section markers in code.
- `console.warn` / `console.error` with `[persona-loader]` prefix
  for diagnostics. No logging facade.
- Template literals for concatenation with interpolation; plain
  strings for fixed-shape banners.
- `node:` protocol on Node core imports.
- Type-only imports for the pi types (`import type { ExtensionAPI }`).
- camelCase for variables and parameters (per the project's
  universal rule; see any `memory.md` in the personas tree).

### Documentation rule

Source and doc move together. Every non-trivial source change
ships with a matching `persona-loader.md` change in the same
commit. The doc is the spec; the source is the implementation.
When they disagree, fix the doc to match the source in the same
commit (source wins, doc follows). This is the same pattern
Marcus uses for the three-file triplet, applied to a single-file
extension.

### Verification routing

Smoke test in dev is *necessary but not sufficient*. After a
change ships, hand the diff + smoke-test output to **Vera** for
formal sign-off (per the Vera persona's loop). Don't claim
"verified" yourself; claim "smoke-tested" and route to Vera.

## People

- **Joachim** — owner. Reports bugs, approves scope changes,
  arbitrates when the loader's contract conflicts with a persona's
  needs, and is the final route for pi host-internals questions
  that remain unclear after consulting the bundled pi documentation.
- **Vera** (verification engineer) — downstream verifier. Hand
  every change to Vera with diff + smoke-test output. Vera's sign-off
  is the source of truth for "verified".
- **Claudia** (system design) — upstream of the personas. Not
  directly downstream of the loader, but a feature request from
  Claudia (e.g. "the loader should support stacking personas")
  is a real feature request and should be treated like one from
  Joachim.
- **Marcus** (lead implementation engineer) — heaviest user of
  the loaded persona. Marcus is most likely to report a bug if
  the loader's output is wrong, because Marcus writes code that
  assumes the persona is in the system prompt.

## Known Issues

(Active. Pulled from `persona-loader.md` § 10; re-add here as new
issues surface. For a bug-fix that closes one of these, move the
row to `## Change Log` with a "closes: <issue>" tag.)

- **State does not survive `/reload`.** `pendingPersonaPrompt`
  is module-level and disappears when the extension is
  re-evaluated by jiti. The TUI footer row has the same lifetime
  (keyed by extension instance). Persistence via a global
  `~/.pi/agent/.persona-state.json` was attempted and rejected:
  a single shared slot would clobber itself across the multiple
  concurrent Pi sessions Joachim runs in different terminals. A
  future fix would need a per-session, not per-host, mechanism
  (per-pid `/tmp` file, environment hint, or accept the
  limitation).
- **No filesystem caching.** Every `/become-persona` call
  re-reads all persona sources and the per-project `.md` files.
  For a handful of small files this is negligible; for users with
  very large memory files it would be worth measuring. Probably not
  worth fixing unless a real user reports slowness.
- **`console.*` writes are visible in agent output.** Unlike
  `ctx.ui.notify`, `console.warn`/`console.error` log lines
  surface in the same stream as agent replies. During heavy
  misconfiguration (e.g. permission denied on the personas
  directory) this can be noisy. Fix candidate: switch to
  `ctx.ui.notify` where the context allows, but note that the
  outer-`try` failure path doesn't have a UI context.
- **`common.md` is treated as optional but recommended.** If it
  is absent there is no warning; only `persona.md` is strictly
  required. Users who delete `common.md` will not notice the
  regression until they look at the system prompt. Fix
  candidate: add a one-line `console.warn` when `common.md` is
  missing, in the same style as the existing `persona.md`-missing
  warning.
- **No protection against symlink loops.** `readdirSync` is
  called with `withFileTypes` so symlinks to directories will be
  enumerated as subdirectories; the loader does not `realpath`
  them. Low-risk because the personas directory is user-managed.
- **No `/persona-status` command.** The user has no way to
  query the active persona at a glance — they have to remember
  what they last `/become-persona`'d, or look at the TUI footer
  for `👤 <Name>`. Fix candidate: register a read-only command
  that reads module-level state via a small inspection helper
  (since persistence is rejected for multi-terminal use).

## Change Log

One line per meaningful loader change, newest first. Detailed rationale lives
in `persona-loader.md`; git history owns the full change trail.

- 2026-07-21 — Cleaned stale references left by the retired harness persona; updated loader summaries and ownership routing.
- 2026-07-04 — Updated loader documentation for the current source-concatenation and autocomplete behavior.
- 2026-07-03 — Updated documentation for the per-project tier, autocomplete, footer status, and identity/behavior assertions.
- 2026-07-02 — Added the per-project persona memory tier and its loader initialization path.


## Open Work

(Pulled from `## Known Issues` and from Joachim's feature
requests. Move to `## Change Log` when work begins; close with a
"closes: <issue>" tag.)

- **Status command** — the user has no way to query the active persona at a glance; a future read-only command would need a module-level inspection helper because persistence is rejected for multi-terminal use.
- **Warn when `common.md` is missing** — see the corresponding
  known-issue entry. Small change; do this first as a warm-up.
- **Switch diagnostics to `ctx.ui.notify` where possible** — see
  the corresponding known-issue entry. Touches the outer-`try`
  failure path, which doesn't have a UI context; needs a design
  decision before implementing.
- **Per-project memory:** Marcus's deviation rule still refers to
  an `AGENT.md` achievement-log entry as the trail mechanism. The
  achievement log no longer exists; this needs a separate follow-up
  with Marcus to repoint the trail at the authoritative module
  documentation.
- **Residual drift from cycle #3 verification (D-11)**
  — README + `persona-loader.md` "Files" tables don't catalog
  `<cwd>/.personas/<persona>/project.md`, the file the loader
  creates. The README does describe the file's behaviour
  elsewhere; this is just the missing catalog row. Small add,
  mechanical.
