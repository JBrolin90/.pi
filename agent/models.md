# Pi Models Configuration

This document explains the model setup in `models.json` and the findings from
debugging tool-call support across the local model stack on `lmde`.

It is a working document — when something here no longer matches reality
(e.g. LM Studio fixes bundled templates, a new model is pulled), update
both this file and `models.json` together.

## TL;DR

- Three local inference backends are configured in `models.json`:
  - `ollama` on `lmde:11434` — **the one to use for tool-using work**.
  - `lmstudio` on `lmde:1234` — **running but not useful yet** (see
    below). Server is loaded with three GGUFs; treat it as a warm model
    cache for the day tool-call support gets fixed.
  - `llama.cpp` on `lmde:8080` — **aspirational**, no `llama-server`
    binary installed, nothing listening on the port. Templates and
    GGUFs are on disk for when it's set up.
- **For agentic / tool-using work today, use `ornith:9b` via Ollama.**
  It is the only model on this server with working tool calls out of
  the box. Switch with `/model` in pi and pick `ornith:9b`.
- **For pure code completion, use `qwen2.5-coder:7b-instruct-q8_0`**
  via Ollama. Fast and high quality, but the Qwen 2.5-coder family
  cannot emit structured tool calls under Ollama 0.31.1.
- **Recommendation: stop here.** The Ollama-based setup (ornith for
  tools, Qwen 2.5-coder for code completion) covers the user's two
  main use cases. Migrating to LM Studio or llama.cpp buys you
  potentially-stronger models (Gemma 4 26B, Qwen 3.6 26B-A3B) but
  with significant template-bug overhead that hasn't been resolved.
  Revisit when the user actually needs a 26B-class model for a
  specific task.

## Final recommendation

**Ship the Ollama setup as-is.** It's a known-working combination:

- `ornith:9b` for anything that needs tools (most agentic flows)
- `qwen2.5-coder:7b-instruct-q8_0` for code completion
- `gemma4-12b-local:latest` as a 12B backup if ornith misbehaves

**Don't migrate to LM Studio or llama.cpp right now.** Both options
have template/parser issues that require either:
- A GUI session to fix templates (LM Studio), or
- Manual jinja work and a `llama-server` install (llama.cpp)

Neither is worth the time given that Ollama + ornith covers the
actual use case.

**If/when a 26B-class model is needed:**
1. First try `lms get lmstudio-community/qwen3.6-coder-30b` (or
   similar community-quantized model with fixed tool templates).
2. If that doesn't work, build llama.cpp from `lab/prj/llama.cpp/`
   and run `llama-server` with an explicit `--jinja` template file
   pointed at the existing GGUF in `models/gguf/`. Wire it up via the
   `llama.cpp` provider entry that's already in `models.json`.

## A note on LM Studio

LM Studio was installed via the **headless CLI installer**
(`curl -fsSL https://lmstudio.ai/install.sh | bash`), not the GUI.
There is no GUI binary on the system — only `~/.lmstudio/bin/lms` (a
104 MB ELF) plus the `llmster` daemon and node workers under
`~/.lmstudio/llmster/0.0.12-1/`. The bash history shows:

```
curl -fsSL https://lmstudio.ai/install.sh | bash
export PATH="/home/joachim/.lmstudio/bin:$PATH"
lms daemon up
lms daemon down
```

This is the official LM Studio headless install path. The GUI has to
be downloaded separately from https://lmstudio.ai/ as a Linux
`.AppImage` (~300 MB). It is **not required** for the local-server
use case. Don't download it unless the visual template editor is
actually needed.

## Architecture

`models.json` defines three providers:

| Provider   | Endpoint            | Backend     | Status                              |
| ---------- | ------------------- | ----------- | ----------------------------------- |
| `ollama`   | `lmde:11434/v1`     | Ollama      | ✅ Running, models loaded           |
| `lmstudio` | `lmde:1234/v1`      | LM Studio   | ✅ Running, models loaded but tool calls broken |
| `llama.cpp`| `lmde:8080/v1`      | llama.cpp   | ❌ Not running (no binary installed)|

All three local endpoints use `api: "openai-completions"` and set:

```json
"compat": {
  "supportsDeveloperRole": false,
  "supportsReasoningEffort": false
}
```

…because their chat templates read `system` rather than `developer`
roles, and they don't honour the `reasoning_effort` parameter.

## Tool-call findings

This is the most important section. It exists because pi and the user
spent real time discovering that local tool-calling is brittle.

### What pi does correctly

When tools are present, pi's OpenAI-compat provider sends them in the
request payload. The streaming parser (see
`pi-ai/dist/api/openai-completions.js`) reads `delta.tool_calls` and
emits `toolcall_start` / `toolcall_delta` / `toolcall_end` events. So as
long as the model returns a `tool_calls` array, pi handles it.

### What the server (Ollama / LM Studio) does on its side

Both Ollama and LM Studio's OpenAI-compat shim do **not** parse raw
model output into `tool_calls`. Instead:

- **Ollama** uses a per-model **parser** that the Modelfile registers
  (`PARSER <name>` or `RENDERER` + `PARSER` for some custom models). If
  no parser is registered, the response is returned as plain text in
  `content`. The available parsers are baked into Ollama at compile
  time.
- **LM Studio** uses a bundled **Jinja chat template** per model. The
  template both renders the prompt and (for trained-for-tool models)
  handles the response-side formatting. If the bundled template has a
  bug, tool calls break for that model.

### Ollama empirical survey

Tested by cloning `qwen2.5-coder:7b` with different `PARSER` lines and
probing `/v1/chat/completions`. None of these names resulted in
structured `tool_calls` for Qwen2.5-coder output:

```
hermes, qwen2, qwen25, qwen2.5, qwen3, qwen3.5, qwen-coder,
qwen2-coder, qwen2_5, qwen-2.5, qwen2.5-coder, qwen-coder-7b,
qwen-2.5, mistral, llama3, phi3, functionary, pythonic
```

For every model pulled on the server:

| Model                           | Tool calls via Ollama | Notes |
| ------------------------------- | --------------------- | ----- |
| `ornith:9b`                     | ✅ works              | Qwen 3.5 based; ships with custom `PARSER ornith`. Best small agentic model. |
| `gemma4-12b-local:latest`       | ✅ works              | 12B, 128K context, has reasoning. |
| `gemma4-26b-a4b-8k`             | ✅ works              | 26B MoE, 128K context. Heavier. |
| `gemma4:latest`                 | ✅ works              | 8B, no reasoning. |
| `qwen2.5-coder:7b-instruct-q8_0`| ❌ text only          | Use for code completion only. |
| `qwen2.5-coder:7b`              | ❌ text only          | Same problem; redundant with the q8_0 above. |
| `qwen2.5-coder:14b`             | ❌ text only          | Bigger, but same Ollama-parser issue. |
| `qwen2.5-coder:3b`              | ❌ text only          | Removed from `models.json`. |
| `qwen2.5-coder:1.5b`            | ❌ text only          | Never listed. |
| `phi4:latest`                   | ❌ no tool support    | Ollama rejects the request. |
| `llama3.1:8b`                   | — not pulled          | |
| `llama3.2:latest`               | — not pulled          | |
| `deepseek-coder:6.7b`           | — not pulled          | |
| `gemma4:e4b`                    | — never existed       | Was a stale entry. |

### LM Studio empirical survey

LM Studio 2.13.0 (CUDA 12) is installed and the server is running on
`:1234`. The three GGUFs in `/home/joachim/models/gguf/` are imported
as symlinks under `~/.lmstudio/models/`. All three report
`trainedForToolUse: true` and the 12B loads successfully into VRAM
(7 GB total, ~3 GB on GPU at `--gpu 0.4`).

| Model (LM Studio identifier) | Size  | Tool calls via LM Studio | Notes |
| ---------------------------- | ----- | ------------------------ | ----- |
| `gemma-4-12b-it-qat`         | 6.5 GB | ❌ jinja template bug   | `"Cannot call something that is not a function: got UndefinedValue"` error. Same bundled template as the 26B. |
| `gemma-4-26b-a4b-it-qat`     | 14 GB  | ❌ jinja template bug   | Same. Loads OK with `--gpu 0.2`. |
| `qwen3.6-vl-reap-26b-a3b`    | 16 GB  | ❌ wrong output format  | Model emits `get_weather(city="Tokyo")` as text; LM Studio's tool-call parser doesn't recognise the Qwen 3.6 format. MoE model, mostly on CPU. |

For all three models, the actual output comes back either as a jinja
error or as `tool_calls: []` with the tool call embedded in `content` —
which is the same class of failure we saw with Ollama, just with a
different root cause (broken bundled template vs. missing parser).

### Why `ornith:9b` works

`ollama show ornith:9b --modelfile` reveals it has a custom parser:

```
RENDERER ornith
PARSER ornith
```

A custom Modelfile-level parser is the only reliable way to add tool-call
support to a model that Ollama's built-in parsers don't understand. The
`ornith` model is shipped with one in its blob, which is why it works
end-to-end.

## LM Studio setup

### What was done

1. `~/.lmstudio/settings.json` was updated to:
   - `enableLocalService: true` (was `false` — the server is off by default)
   - `modelLoadingGuardrails.customThresholdBytes: 21474836480` (20 GB; default 4 GB would block the 12B)
   - `defaultContextLength: 8192` (was 4096)
2. The three GGUF files in `/home/joachim/models/gguf/` were imported
   with `lms import -l` (symbolic-link mode, no duplication):
   - `gemma-4-12b-it-qat-q4_0.gguf` → `google/gemma-4-12B-it-qat-q4_0-gguf/`
   - `gemma-4-26B_q4_0-it.gguf` → `google/gemma-4-26B-A4B-it-qat-q4_0-gguf/`
   - `Qwen3.6-VL-REAP-26B-A3B-text-Q4_K_M.gguf` → `keithnull/Qwen3.6-VL-REAP-26B-A3B-GGUF/`
3. The server was started with `lms server start --port 1234 --bind 0.0.0.0`.
4. Each model was tested for load + tool calls (see table above).

**Important caveat about the install:** this was the headless CLI
install, not the GUI. See [A note on LM Studio](#a-note-on-lm-studio).

### Current state

- LM Studio server is **running** on `lmde:1234` (PID 915025, the
  `llmster` daemon).
- The `qwen3.6-vl-reap-26b-a3b` model is currently loaded (15.15 GB
  total, mostly on CPU at `--gpu 0.2`). Free VRAM: ~3.0 GB.
- The Gemma 4 models are unloaded.
- Tool calls don't work for any of the three models (see table
  below).

### To stop the server when done

```bash
lms server stop        # stops the HTTP server, keeps the daemon
lms daemon down        # stops the daemon entirely
```

The symlinks in `~/.lmstudio/models/` persist either way. To remove
the LM Studio provider from pi's view, edit `models.json` (delete the
`lmstudio` provider block) — no other cleanup needed.

### What still needs to be done to make tool calls work

For each Gemma 4 model, the bundled jinja template has a known bug. The
fix requires **overriding the prompt template per model** in the LM
Studio GUI:

1. Download the LM Studio GUI `.AppImage` from https://lmstudio.ai/
   (~300 MB) — **only if** the visual editor is actually wanted.
2. Open LM Studio.
3. Go to **My Models** in the sidebar.
4. Click on `gemma-4-12b-it-qat` (or the 26B).
5. Open **Prompt Template** settings.
6. Paste in a working Gemma 4 tool-use template. The
   `google-gemma-4-31B-it.jinja` in `lab/prj/llama.cpp/models/templates/`
   is a starting point (the 12B uses the same tool format, just a
   different layer count).
7. Save and reload the model.

For the Qwen 3.6 26B-A3B, the issue is different: the model itself
emits the older Qwen 2.5-coder style output (`get_weather(...)` as
text) rather than the `<tool_call><function=...>...</tool_call>` format
that the bundled template expects. Options:

1. **Use a different Qwen 3.6 quant** — the `keithnull` Qwen 3.6 GGUF
   in use here is the REAP (pruned) variant, which may not have been
   re-trained for tools. Pull the `lmstudio-community` Qwen 3.6 build
   instead: `lms get lmstudio-community/qwen3.6-coder-30b` (or similar
   non-REAP variant).
2. **Switch to a Qwen 3.5 or Qwen 3 Coder model** with confirmed
   tool-call format support.
3. **Use Ollama's `ornith:9b`** in the meantime (recommended; works).

### Loading commands reference

```bash
# Start the server
lms server start --port 1234 --bind 0.0.0.0

# Load a model with partial GPU offload
lms load --gpu 0.4 --context-length 4096 gemma-4-12b-it-qat
lms load --gpu 0.2 --context-length 4096 gemma-4-26b-a4b-it-qat
lms load --gpu 0.2 --context-length 4096 qwen3.6-vl-reap-26b-a3b

# Unload to free VRAM
lms unload <identifier>

# Check what's loaded
lms ps
```

The 12B fits at `--gpu 0.4` with 4K context. The 26B and Qwen 3.6 need
`--gpu 0.2` or lower to leave room for compute buffers on a 6 GB GPU.
The X server uses ~700 MB of VRAM, so the effective ceiling is ~5.4 GB
for model + buffers.

## Per-model entry notes

### `ollama` provider

- **`ornith:9b`** — primary agentic model. `reasoning: true` enables
  pi's thinking-level controls; `supportsStrictMode: true` lets pi
  send `strict: true` in tool definitions.
- **`gemma4-12b-local:latest`** — backup agentic model. 12B, 128K
  context. Slower than ornith but more capable on long-horizon tasks.
- **`gemma4-26b-a4b-8k`** — heavyweight, 26B MoE, 128K context.
- **`gemma4:latest`** — 8B general-purpose, no reasoning.
- **`llama3.1:8b`** — not currently pulled. Pull when needed.
- **`qwen2.5-coder:7b-instruct-q8_0`** — pure code completion. Higher
  quality than the Q4_K_M `7b`; still no tool support (see findings
  above).

### `lmstudio` provider

All three entries point at the LM Studio server on `lmde:1234/v1`. As
of writing, **none of them work for tool calls** — see
[LM Studio setup](#lm-studio-setup) for the fix path.

- **`gemma-4-12b-it-qat`** — primary candidate once the template is
  fixed. Best fit for the 6 GB VRAM (~3 GB on GPU at 0.4 offload).
- **`gemma-4-26b-a4b-it-qat`** — heavier option. Mostly on CPU; expect
  5-15 tok/s. `maxTokens` set to 8K to bound context.
- **`qwen3.6-vl-reap-26b-a3b`** — Qwen 3.6 26B-A3B MoE (3B active
  params per token). Mostly on CPU. The "text-only" variant of a
  vision-capable model — `input: ["text"]` strips image input.

### `llama.cpp` provider

- **`gemma-4-12b-it-qat-q4_0`** — 12B Gemma 4 run with 25/48 GPU
  layers. `contextWindow: 6144`, `maxTokens: 2048`. Currently
  aspirational: the `llama-server` binary isn't installed and port
  8080 isn't listening. If you ever set up llama.cpp directly, this
  entry should work.
- **`qwen-3.6-26b-A3B-text-q4_K_M`** — Qwen 3.6 26B-A3B (text-only)
  MoE in Q4_K_M. `reasoning: true`, `maxTokens: 62048`.

## Adding a new model

When you pull a new model and want to use it in pi, do this:

1. **Verify the model works for tools** (if you care about that):

   ```bash
   curl -s http://lmde:11434/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{
       "model": "new-model:tag",
       "messages": [{"role":"user","content":"Call get_weather for Tokyo. You must use the tool."}],
       "tools": [{"type":"function","function":{"name":"get_weather","description":"Get weather","parameters":{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}}}]
     }'
   ```

   …and check that the response has a `tool_calls` array, not just
   `content` containing JSON.

2. **Add to `models.json`** under the appropriate provider. Minimal
   entry:

   ```json
   { "id": "new-model:tag" }
   ```

   With reasoning + strict mode (recommended for tool-using models):

   ```json
   {
     "id": "new-model:tag",
     "reasoning": true,
     "compat": { "supportsStrictMode": true }
   }
   ```

3. **Reopen `/model` in pi.** `models.json` is reloaded on every
   `/model` invocation; no restart needed.

4. **Update this file** so the next person reading it knows what the
   model does and whether it works for tools.

## Troubleshooting

### "My tool-using model is emitting JSON in `content` instead of `tool_calls`"

For Ollama: this is the Qwen 2.5-coder + Ollama issue documented above.
Switch to `ornith:9b` (or any Gemma 4 variant) for tool use. The model
itself is fine — Ollama is the bottleneck.

For LM Studio: this is the bundled-template bug. Open the LM Studio
GUI and override the prompt template per model. Or pull an
`lmstudio-community` model which has a fixed template.

### "Ollama: model not found in `--list-models`"

- Did you `ollama pull` it?
- Check `~/.pi/agent/models.json` is valid JSON: `python3 -m json.tool
  ~/.pi/agent/models.json`.
- pi reads `models.json` on every `/model` call. The `--list-models`
  output reflects the current state of the file.

### "Warning: No models match pattern \"provider/model-id\"\" at startup

The warning comes from `~/.pi/agent/settings.json` → `enabledModels`,
not from `models.json`. `enabledModels` pins `provider/model-id` pairs
that pi resolves against `models.json` at startup; entries that no
longer exist in `models.json` produce one warning each. Fix: drop the
stale entries from `enabledModels` (or re-add the model to
`models.json` if you actually want it available).

### "LM Studio: 'Error rendering prompt with jinja template'"

This is the bundled template bug for the model. See
[LM Studio setup](#lm-studio-setup) for the fix.

### "LM Studio: OOM on model load"

The X server uses ~700 MB of VRAM, leaving ~5.4 GB for models on a 6
GB GPU. Lower `--gpu` offload to leave room for compute buffers:

```bash
lms load --gpu 0.2 --context-length 4096 <model>
```

For the 16 GB Qwen 3.6, even `--gpu 0.2` is tight. Drop to
`--gpu 0.1` or expect most layers on CPU.

### "Auth errors on a local provider"

Ollama and LM Studio ignore the `apiKey` value, but pi still requires
*something* to be set. Don't remove `apiKey: "ollama"` or
`apiKey: "lmstudio"` from `models.json`.

### "llama.cpp model won't load on `lmde:8080`"

That's a server-side problem, not a pi config problem. The
`llama.cpp` provider entry in `models.json` is aspirational — no
server is running on port 8080, and `llama-server` isn't installed.
If you want to use this provider, install `llama.cpp`
(`apt install llama.cpp` or build from `lab/prj/llama.cpp/`), start
the server, and load a model.

## Files in this directory

- `models.json` — the live model configuration that pi reads.
- `models.md` — this document.
- `settings.json` — pi's session settings (orthogonal to models).
- `auth.json` — API keys (do not commit).

## Change log

- **2026-07-03 (settings sync)**
  - Added a Troubleshooting entry: `"Warning: No models match pattern
    \"provider/model-id\""` at startup comes from stale entries in
    `~/.pi/agent/settings.json` `enabledModels`, not from
    `models.json`. Pin a model in `enabledModels` only if it's still
    listed in `models.json`.
- **2026-07-03 (Final)**
  - Documented final recommendation: ship the Ollama setup with
    `ornith:9b` for tool use, do not migrate to LM Studio or
    llama.cpp right now.
  - Documented the LM Studio headless-CLI install (no GUI binary
    present) and the implication for the template-fix path.
  - Recorded current LM Studio server state (running, qwen3.6
    loaded).
- **2026-07-03 (LM Studio pass)**
  - Enabled LM Studio local server (`enableLocalService: true`,
    bumped guardrail to 20 GB, default context 8K).
  - Imported the three existing GGUFs as symlinks.
  - Verified all three load successfully.
  - Verified all three have broken tool calls (different bugs: jinja
    template bug for Gemma 4, output-format mismatch for Qwen 3.6).
  - Added `lmstudio` provider to `models.json` with all three models.
  - Recommended fix path: GUI template override, or use
    `ornith:9b` via Ollama for now.
- **2026-07-03 (Ollama pass)**
  - Cleaned up `models.json`: removed `gemma4:e4b` (didn't exist),
    removed the stray `openai` provider (missing `api`, collision
    risk), removed `qwen2.5-coder:3b` and `qwen2.5-coder:7b`
    (redundant, both broken for tools), removed `llama3.2:latest`,
    `deepseek-coder:6.7b` (not pulled), `phi4:latest` (no tool
    support).
  - Promoted `ornith:9b` and `gemma4-12b-local` to top of the ollama
    list with `reasoning: true` and `supportsStrictMode: true`.
  - Documented the Qwen2.5-coder + Ollama tool-call limitation in
    detail.
