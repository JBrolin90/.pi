---
name: cinnamon-titlebar
description: Adjust window titlebar size in the active Cinnamon theme. Use when the user wants smaller or larger window titlebars.
---

# Cinnamon Titlebar Size Adjuster

## Usage

This skill modifies the window titlebar height in the active Cinnamon theme.

### Interactive Mode
Ask the user for their desired height, then run:
```bash
./scripts/set-titlebar.sh <height>
```

### Preset Sizes
- **Small (24px)**: Compact, modern look
- **Normal (30px)**: Default Cinnamon size  
- **Large (36px)**: Taller, more visible

## Commands

### Set Titlebar Size
```bash
./scripts/set-titlebar.sh 24
```

### Restart Cinnamon (to apply changes)
Press `Alt+F2`, type `r`, and press Enter.

## What Gets Modified

The script adds CSS rules to the theme's `cinnamon.css`:
```css
.decoration, .titlebar {
    min-height: 24px;
    padding: 0 4px;
}

.window-buttonbox {
    min-height: 24px;
}
```

## Finding the Theme

The script automatically detects the active theme via:
```bash
gsettings get org.cinnamon.desktop.interface gtk-theme
```

Theme CSS files are located at:
- `~/.themes/<theme>/cinnamon/cinnamon.css` (user themes)
- `/usr/share/themes/<theme>/cinnamon/cinnamon.css` (system themes)

## Troubleshooting

1. **Changes not visible?**
   - Restart Cinnamon: `Alt+F2` → type `r` → Enter

2. **Theme not found?**
   - Check available themes: `ls ~/.themes/` or `ls /usr/share/themes/`

3. **Want to revert?**
   - Remove the added CSS block from the theme's `cinnamon.css`
   - Or set height back to 30 for default size