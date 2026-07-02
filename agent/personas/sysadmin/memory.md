# Memory System Categories

## Personal -- location, preferences, background
Address: Alicante, Spain
Favorite color: blue
- Currently running on: Main PC (192.168.1.10)

## Cinnamon Configuration
- Thin titlebars: **laptop only** (not synced to Main PC)
- File paths on laptop:
  - `~/.config/gtk-3.0/gtk.css`
  - `~/.config/gtk-4.0/gtk.css`
- Current: 24px titlebars
- Target: all GTK header bars
- Config:
```css
/* Shrink all GTK header bars and Muffin system title bars */
headerbar,
.titlebar,
.default-decoration {
  min-height: 24px;
  padding-top: 0px;
  padding-bottom: 0px;
}

headerbar button.titlebutton,
.titlebar button.titlebutton,
.default-decoration button.titlebutton {
  min-height: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
}
```

## Persona System
Personas are stored in ~/.pi/agent/personas/ with each persona in its own directory:
- common.md: shared across all personas (stays at root level)
- <persona>/persona.md: main persona definition
- <persona>/memory.md: persona-specific memory
- <persona>/*.md: additional files referenced with ./ from persona.md
- ../common.md: reference to shared common.md from within a persona
## Voice -- tone, prhasing, writing corrections
## Process -- how I want tasks done
- Apply the information organization principles from common.md
- When uncertain where to store something, apply the Single Source of Truth principle: prefer referencing config files or architecture docs over duplicating data
- Keep memory.md lean; move static facts to architecture docs or config files
- **Internalize how you think**: Desktop/laptop have different purposes. Main PC has a large monitor — no theme tweaks needed. Laptop adjustments are about conserving display real estate. Settings are not synced between machines. Always note which machine a config applies to.
## People -- who people are, relationships
- Wife: Sugey
- Home Assistant expert persona: Hazel (located in `~/.pi/agent/personas/Hazel/persona.md`)
  - Uses local LLM: `ollama/qwen2.5-coder:7b`
## Project -- active work, current task, status
- NavIntel: [Details to be added]
## Output -- formats, naming, delivery preferences
## Tools -- Which tools to use
- **llama.cpp** (user-local, no sudo): built from source at `~/local/llama.cpp` (binaries), `~/local/llama.cpp/lib` (libs), `~/src/llama.cpp` (source). Built with `-DLLAMA_BUILD_SERVER=ON`. Symlinks in `~/bin/`. cmake at `~/local/cmake`. Models dir: `~/models/gguf`. Logs: `~/logs/llama.cpp`. PATH configured in `~/.bashrc`. Server PID: `~/logs/llama.cpp/server.pid`. Default server args: `-c 32768 -t 12 --host 127.0.0.1 --port 8080`. Pi `models.json` configures model with `contextWindow: 16384` (practical limit given CPU prompt-eval speed ~18 tok/s; server ctx stays at 32768 for headroom). 12B Q4 model RSS ~14 GB; ~190 KB/token KV cache.



