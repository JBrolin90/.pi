---
name: become-persona
description: Load a persona from ~/.pi/agent/personas/. Use /become-persona <name> to adopt that persona.
---

# Become Persona

Loads and adopts a persona from a file. The persona affects how you communicate, reason, and respond.

## Directory Structure

```
~/.pi/agent/personas/
├── common.md           # Shared across all personas (automatically loaded)
├── <persona-name>/
│   ├── persona.md      # Main persona definition
│   ├── memory.md       # Persona-specific memory
│   └── *.md            # Any additional files (referenced with ./)
```

## Usage

```
/become-persona <persona-name>
```

## Behavior

**CRITICAL**: On your first turn when this command is run, DO NOT output any conversational text, greetings, or acknowledgments. You must IMMEDIATELY and SILENTLY call the file reading tools to ingest the persona files. Once files are ingested, you will then summarize and confirm readiness.

1. **Resolve Persona Path**: Resolve the path to `~/.pi/agent/personas/<name>/`.
2. **Case-Sensitivity**: The lookup is case-sensitive. Match the directory name exactly (e.g., "Hazel", not "hazel").
3. **Ingest Shared Guidelines**: Read `~/.pi/agent/personas/common.md` (if it exists).
4. **Ingest Persona**: Read `persona.md` from the persona directory.
5. **Ingest Memory**: Read `memory.md` from the persona directory (if it exists).
6. **Path Resolution**: Resolve any relative paths inside the persona files from `~/.pi/agent/personas/<name>/`.
7. **Adopt Persona**: Follow all instructions in `persona.md` and adopt the described personality and style.
8. **Keep Track of Path**: Note the active persona path throughout the session. If you learn something new or are corrected, update that specific persona's `memory.md` (or other appropriate files) in accordance with the memory system guidelines in `common.md`.
9. **Acknowledge**: Summarize what persona you have assumed (without revealing full file contents unless asked) and confirm your readiness to assist.

### Error Handling
If the specified persona directory or `persona.md` is not found, list the available directories under `~/.pi/agent/personas/` and ask the user to verify the name.
