# Theo — Session Memory

> Last updated: 2026-06-29, end of session work block
> Active project: `/home/joachim/lab/prj/Blueprint/`

## User Profile
- **Name**: Joachim
- **Active project**: Generic Software Development Team Blueprint — a highly scalable, reusable organizational blueprint for software development teams comprising humans + AI agents
- **Working style**: Highly collaborative, incremental, expects strict memory maintenance
- **Strong preferences** (apply these to every interaction with Joachim):
  - Iterative one-step-at-a-time approach — never dump a massive blueprint; draft, reflect, refine, lock in
  - **memory.md (this file) must be updated after each loop / major milestone** — Joachim will call this out if missed
  - **Project's `blueprint.md` must be updated after each role spec approval**
  - **CD/Lean reflection must be explicit in every role spec** — not patched in later; apply from first draft
  - **Hand-off gating column required in every spec** (Trust / Gate per hand-off)
  - **Founder retains the right to gate any hand-off** — orchestration overlay, not a domain claim
  - **Domain specialists are AI agents** (never human-worn); R+A for their domain; no starter catalog (project-instantiated)
  - **Specialists inform the PM** (PM is hub; specialists are spokes); direct escalation to Founder for Vetoes
- **Communication preference**: Asks questions in plain text, sometimes with implicit corrections (e.g., "I see the domain specialists as AI Agents, not humans" = correction). Read carefully and reflect back before adjusting.

## Project: Generic Software Development Team Blueprint

### Established framework (frozen as v0.4, 2026-06-29)
- **Role taxonomy** (4 axes):
  1. Discipline: Product · Design · Engineering · Quality · (Operations, Data/ML, Security excluded from default scope)
  2. Lifecycle stage: Discovery → Design → Build → Ship → Operate
  3. Authority layer: IC / Lead / Manager / Director+
  4. Entity type: 🧑 Human · 🤝 Hybrid · 🤖 AI Agent
- **Default context**:
  - Team size: Solo founder + AI swarm (1 human, multiple specialist agents)
  - AI agents are first-class team members
  - Methodology: Continuous Deployment / Lean Startup (BML loops, hypothesis-driven bets, A/B testing, on-call)
- **Role catalog**: 9 core roles + parametric domain specialists
- **Three frozen principles**:
  1. **Hand-off Gating Principle** — Founder can Trust or Gate any hand-off; gating is orchestration, not domain claim
  2. **CD/Lean Reflection Principle** — every spec reflects continuous deployment + BML
  3. **PM-as-Hub Principle** — PM is hub for domain knowledge flow; specialists inform PM
- **Spec schema**: 12 sections
  1. Name & tagline
  2. Default entity type
  3. Lifecycle stages (Primary / Secondary / On-call)
  4. Mission
  5. Responsibilities (owns)
  6. Hand-offs — receives (with Default gating)
  7. Hand-offs — delivers (with Default gating)
  8. Decision authority (decides / recommends / delegates / honors / defers)
  9. Escalation triggers
  10. Tools / inputs
  11. Outputs / success signals (must include cadence metrics)
  12. Anti-patterns (must include big-bang / data-averse modes)

### Role specs approved (9/9) ✅
1. `roles/founder-orchestrator.md` — v0.2 (CD/Lean patched in)
2. `roles/product-manager.md` — v0.2 (CD/Lean patched in; PM-as-hub applied)
3. `roles/user-researcher.md` — v0.2 (CD/Lean patched in)
4. `roles/product-designer.md` — v0.2 (CD/Lean baked in + lean-tools patch)
5. `roles/tech-lead-architect.md` — v1.0 (CD/Lean baked in from first draft)
6. `roles/frontend-engineer.md` — v1.0 (CD/Lean baked in from first draft)
7. `roles/backend-engineer.md` — v1.0 (CD/Lean baked in from first draft)
8. `roles/build-ship-engineer.md` — v1.0 (CD/Lean baked in; this role *is* the CD engine)
9. `roles/quality-engineer.md` — v1.0 (CD/Lean baked in; quality metrics feeding BML first-class)
10. `roles/domain-specialist.md` — v1.0 (template, final artifact)

### Remaining artifacts
_None — blueprint is complete._

### To draft after core roles
- `roles/domain-specialist.md` — generic specialist template

## Working Agreements (how to work with Joachim)

1. **Save before approving the next loop**: When user approves a role spec, immediately save to `roles/[name].md` and update `blueprint.md` *before* drafting the next role.
2. **Memory maintenance**:
   - Update `memory.md` (this file) after each role spec approval at minimum; on major milestones otherwise.
   - Update project's `blueprint.md` (Achievement Log, Reference Documents, Maturity / Next Milestone, Pending Work) on every spec change.
3. **CD/Lean in every spec from the start** — don't accept a spec without explicit CD/Lean reflection. Patch existing specs as needed rather than skipping.
4. **One role per loop** — draft, reflect, refine, lock in. Don't move to next role without explicit user approval.
5. **Ask questions to lock in choices** — when requirements are ambiguous, ask 2-4 options (multi-select where appropriate) before drafting.
6. **Reflect, don't dictate** — after drafting each spec, ask "captures it well?" or a more focused meta-question.
7. **Use `ask_user_question` for binary / multi-choice decisions**; reserve plain prose for open-ended reflection.

## Lessons Learned This Session

- **Don't pre-supply a starter catalog** for domain specialists. Joachim explicitly rejected the 12-specialist starter catalog in favor of per-project instantiation. Reason: needs vary greatly by project (e.g., Sr Accountant + Lawyer in one project, ESP32 specialist in another).
- **Domain specialists are AI Agents, not humans**. Joachim corrected this from initial proposal. In a solo-founder + AI-swarm setup, domain expertise is always delegated to specialist agents who are R+A for their domain.
- **Specialists inform the PM** (PM is hub) was another correction. PM does not own domain knowledge — PM integrates it. Specialists still have direct escalation to Founder for Vetoes.
- **Apply methodology from first draft, not as patch**. Joachim had to flag that Founder/PM/UR specs (drafted before CD/Lean was decided as a hard principle) lacked CD/Lean reflection. Lesson: when methodology is locked in early, every subsequent spec must reflect it from the first draft.
- **Joachim values memory hygiene highly**. Two separate memory files must be maintained:
  - `blueprint.md` (project state, at project root)
  - `memory.md` (Theo persona state, at `~/.pi/agent/personas/Theo/memory.md`)
- **Founder's hand-off gating right is a recurring insight** — Joachim wants the option to "check a hand-off before giving it to the receiver" even on specialists. This is a governance overlay, not a domain claim. Bake it into every spec's hand-off tables.

## Open Threads / Watch-outs

- **Blueprint is complete.** Next phase is application: a real project instantiates project-specific specialists from the domain-specialist template.
- **Always check `blueprint.md` consistency** — Joachim noticed stale "Pending Work" entries when FE was approved; clean up at every opportunity
- **If memory maintenance is missed, Joachim will call it out** — never skip updating both memory files after a role approval

## State at end of session work block (2026-06-29)

- **BLUEPRINT COMPLETE.** ✅ All 9 core role specs + Domain Specialist template approved and saved to disk.
- `blueprint.md` reflects completed state (Achievement Log, Reference Documents, Maturity / Next Milestone all updated; Pending Work cleaned)
- memory.md (this file) populated and updated after each role approval
- **2026-06-29 (rename)**: Project's `AGENT.md` renamed to `blueprint.md` to reflect its content (the blueprint document, not just agent memory). All references in this memory file updated.
- Next session work: apply blueprint to a real project; instantiate specialists as needed