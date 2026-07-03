# Idun — Memory

## Process

### Config-change order: doc first, JSON second

For every model change: edit `models.md` first (Per-model notes +
empirical table + Change log), then edit `models.json` to match. The
doc is the spec; the JSON is the code. When they disagree, JSON
wins (Pi re-reads it on every `/model`); fix the doc in the same
change.

### Tool-call claims require a probe, not a README

Before recommending a model for agentic work, run the curl probe
in `persona.md` § *How You Work / For a config change / step 1* and
record the raw JSON. If `tool_calls: []` with the call in
`content`, the model does NOT support tools for Pi — regardless of
what the model card says. Don't promote such a model to the agentic
recommendation list without flagging this.

### Benchmark, don't estimate

VRAM, TTFT, tok/s — measured values, not "should be". One sample is
n=1; report a median of ≥3. Estimates from parameter count are
wrong often enough to be misleading; don't put them in `models.md`.

### Address

Joachim.

## LLM Stack (durable facts about the lmde setup)

These won't change session-to-session. The authoritative version
lives in `~/.pi/agent/models.md` — this section is the minimum
context to remember between sessions.

### Three providers, one working today

- **Ollama** at `lmde:11434/v1` — running, models loaded.
  This is the working tool-call provider today.
- **LM Studio** at `lmde:1234/v1` — running, three GGUFs imported
  as symlinks (`~/.lmstudio/models/`), tool calls broken for all
  three due to jinja template / output-format bugs. Treat as a
  warm model cache until templates are fixed.
- **llama.cpp** at `lmde:8080/v1` — not running. No
  `llama-server` binary installed; port is dark. The `llama.cpp`
  entry in `models.json` is aspirational.

### Currently recommended (set in models.md 2026-07-03)

- **`ornith:9b` via Ollama** for any agentic / tool-using work.
  Only model on this server with working tool calls out of the box.
  Ships with a custom `PARSER ornith` in its Modelfile — that's the
  reason it works.
- **`qwen2.5-coder:7b-instruct-q8_0` via Ollama** for pure code
  completion. The Qwen 2.5-coder family cannot emit structured tool
  calls under Ollama 0.31.1 (no parser for it). It is correct
  *because* it's used without tools.
- **`gemma4-12b-local:latest` via Ollama** as a 12B backup if
  ornith misbehaves. Slower, longer context, also tool-capable.

### Compat flag invariants

All three providers set:

```json
"compat": {
  "supportsDeveloperRole": false,
  "supportsReasoningEffort": false
}
```

Their chat templates read `system` not `developer`, and they don't
honour `reasoning_effort`. Pi needs to know this to render prompts
correctly. Don't remove these flags without confirming the model
template change first.

### VRAM budget

6 GB GPU on `lmde`, ~700 MB used by the X server → ~5.4 GB
effective for model + compute buffers. The 12B Gemma fits at
`--gpu 0.4`; the 26B and Qwen 3.6 need `--gpu 0.2` or lower.

### LM Studio is headless on this box

LM Studio was installed via the headless CLI installer
(`curl -fsSL https://lmstudio.ai/install.sh | bash`). No GUI
binary is present. The CLI is `~/.lmstudio/bin/lms` plus the
`llmster` daemon under `~/.lmstudio/llmster/`. Fixing per-model
jinja templates currently requires downloading the GUI `.AppImage`
from https://lmstudio.ai/ (~300 MB). Don't assume the GUI is
available; ask before recommending it as a fix step.

### The Ollama parsers available on this server

Ollama's parsers are baked in at compile time, not user-extensible
without a custom Modelfile. The working approach for a model
without a built-in parser is a custom `RENDERER` + `PARSER` line in
the Modelfile. Empirically, the Qwen 2.5-coder family has no
working parser under Ollama 0.31.1; switching to `ornith` or
Gemma 4 is the practical fix.

## Known Issues (non-obvious gotchas)

These are bug-class entries the next session shouldn't have to
rediscover. Add a row here only when the issue is non-obvious and
recurring; one-off probe results belong in `models.md`.

- **Ollama `qwen2.5-coder:<size>` returns tool calls in
  `content` text, not in `tool_calls`.** Probed for sizes
  1.5b / 3b / 7b (Q4_K_M and Q8_0) / 14b. All fail. Not a
  model bug — Ollama-side parser missing. Don't re-probe unless
  Ollama version changes; record is in `models.md`.
- **LM Studio Gemma 4 12B / 26B both fail with
  "Cannot call something that is not a function: got
  UndefinedValue".** Bundled jinja template bug, same root
  cause for both sizes. Fix requires GUI template override,
  which we can't do today (no GUI installed).
- **LM Studio Qwen 3.6 26B-A3B REAP (keithnull) emits
  `get_weather(...)` as text, not in `tool_calls`.** Different
  bug class: model-output format mismatch. The REAP variant
  may not have been re-trained for tools. Try the
  `lmstudio-community/qwen3.6-coder-30b` quant instead.
- **`/model` picker silently drops invalid `models.json`
  entries.** Validate with `python3 -m json.tool
  ~/.pi/agent/models.json` after every edit. Pi parses
  leniently and skips bad rows without warning.
- **Custom Ollama models are blob-stored; `ollama rm` destroys
  the Modelfile.** Keep a copy in
  `~/models/modelfiles/<name>.modelfile` whenever you customise
  one (ornith is fine; we didn't customise it, the upstream
  blob ships with the parser).

## Handoff

- **Config or tool-call bug?** → me (Idun).
- **Pi extension / system-prompt bug?** → Maya for the loader,
  Pi persona for pi internals.
- **OS-level issue (GPU, drivers, host config)?** → Alan.
- **Final acceptance of a benchmark or recommendation?** → Vera.

## Change Log

- **2026-07-03** — Created Idun persona; documented the
  steward loop (config change → probe → models.md →
  models.json), the Ollama-parser reality check, the LM
  Studio headless-install constraint, and the VRAM budget.
  Seeded this memory file from `models.md`'s *Current
  recommendation*. No `models.json` / `models.md` edits in
  this commit — those are Idun's responsibility going
  forward, not part of persona creation.
