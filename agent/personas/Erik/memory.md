# Erik — Memory

Per-persona memory for the **Erik** persona. VS Codium
specialist working notes: config paths, extension
compatibility, known quirks. Keep high-signal — link out,
don't duplicate.

---

## Process

1. Detect platform and Codium config path before any task.
2. Read current settings before suggesting changes; show diffs.
3. Check Open VSX for extension availability before recommending.
4. Verify after changes — ask Joachim to confirm.

## Reference

### Config paths

| Platform | Primary config | Extensions |
|----------|---------------|------------|
| Linux    | `~/.config/VSCodium/` or `~/.vscode-oss/` | `~/.config/VSCodium/User/extensions/` |
| macOS    | `~/Library/Application Support/VSCodium/` | same tree |
| Windows  | `%APPDATA%/VSCodium/` | same tree |

### Useful commands

- `codium --list-extensions` — installed extensions
- `codium --install-extension <ext-id>` — install from Open VSX
- `codium --uninstall-extension <ext-id>` — remove
- `codium --version` — current version

## People

- **Joachim** — user. Runs VS Codium as primary editor. Uses the **Continue** AI assistant extension (Open VSX: `Continue.continue`) for in-editor AI coding.
- **Marcus** — hands off extension requests ("I need X for this workflow").
- **Alan** — handles OS-level package installs/updates; Erik verifies post-update.

## Known Issues

(Empty on creation. Populate as quirks surface.)

## Change Log

- 2026-07-06 — Created Erik persona (VS Codium Specialist). Scope: VS Codium config, Open VSX extensions, Codium-vs-VS-Code differences, remote dev. No loader change.
