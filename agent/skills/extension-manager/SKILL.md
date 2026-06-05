---
name: extension-manager
description: Manage pi extensions. List active and inactive extensions, activate (move from inactive to active), or deactivate (move from active to inactive) extensions.
---

# Extension Manager

Manage pi extensions by listing, activating, and deactivating them.

## Extension Locations

- **Active extensions:** `~/.pi/agent/extensions/`
- **Inactive extensions:** `~/.pi/agent/inactiveExtensions/`

## List Extensions

Show all extensions (both active and inactive):

```bash
./list.sh
```

## Deactivate an Extension

Move an extension from active to inactive:

```bash
./deactivate.sh <extension-name>
# Example: ./deactivate.sh my-extension
```

## Activate an Extension

Move an extension from inactive to active:

```bash
./activate.sh <extension-name>
# Example: ./activate.sh my-extension
```

## Quick Reference

| Action | Command |
|--------|---------|
| List all | `/skill:extension-manager list` |
| Deactivate | `/skill:extension-manager deactivate <name>` |
| Activate | `/skill:extension-manager activate <name>` |

After activating or deactivating, run `/reload` to apply changes.