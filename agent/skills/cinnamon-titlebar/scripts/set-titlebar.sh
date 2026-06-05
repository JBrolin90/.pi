#!/bin/bash
# Adjust Cinnamon window titlebar and button sizes
# Works on both user themes (~/.themes/) and system themes (/usr/share/themes/)
# Usage: ./set-titlebar.sh <height_in_pixels> [--window-only]
# Examples: 
#   ./set-titlebar.sh 24      # Set titlebar to 24px
#   ./set-titlebar.sh 24 --window-only  # Only adjust metacity window borders

set -e

HEIGHT="${1:-30}"
WINDOW_ONLY="${2:-}"

get_active_theme() {
    gsettings get org.cinnamon.desktop.interface gtk-theme 2>/dev/null | tr -d "' "
}

find_cinnamon_css() {
    local theme="$1"
    if [ -f "$HOME/.themes/$theme/cinnamon/cinnamon.css" ]; then
        echo "$HOME/.themes/$theme/cinnamon/cinnamon.css"
    elif [ -f "/usr/share/themes/$theme/cinnamon/cinnamon.css" ]; then
        echo "/usr/share/themes/$theme/cinnamon/cinnamon.css"
    else
        echo ""
    fi
}

find_metacity_xml() {
    local theme="$1"
    if [ -f "$HOME/.themes/$theme/metacity-1/metacity-theme-1.xml" ]; then
        echo "$HOME/.themes/$theme/metacity-1/metacity-theme-1.xml"
    elif [ -f "/usr/share/themes/$theme/metacity-1/metacity-theme-1.xml" ]; then
        echo "/usr/share/themes/$theme/metacity-1/metacity-theme-1.xml"
    else
        echo ""
    fi
}

update_cinnamon_css() {
    local css_file="$1"
    local height="$2"
    
    if [ ! -f "$css_file" ]; then
        echo "  Warning: Cinnamon CSS not found at $css_file"
        return 1
    fi
    
    # Check if we need to add the CSS block
    if ! grep -q "/* cinnamon-titlebar size */" "$css_file" 2>/dev/null; then
        cat >> "$css_file" << TITLEBARCSS

/* cinnamon-titlebar size: ${height}px - managed by cinnamon-titlebar skill */
.decoration, .titlebar {
    min-height: ${height}px;
    padding: 0 4px !important;
}

.window-buttonbox {
    min-height: ${height}px;
}
TITLEBARCSS
    else
        # Update existing block
        sed -i "s|/\* cinnamon-titlebar size: [0-9]*px.*\*/||g" "$css_file" 2>/dev/null
        sed -i "s/^\.decoration, \.titlebar {$//g" "$css_file" 2>/dev/null
        sed -i "s/^    min-height: [0-9]*px;$//g" "$css_file" 2>/dev/null
        sed -i "s/^    padding: 0 4px !important;$//g" "$css_file" 2>/dev/null
        sed -i "s/^\.window-buttonbox {$//g" "$css_file" 2>/dev/null
        sed -i "s/^    min-height: [0-9]*px;$//g" "$css_file" 2>/dev/null
        
        # Clean up empty lines
        sed -i '/^$/d' "$css_file" 2>/dev/null || true
        
        cat >> "$css_file" << TITLEBARCSS

/* cinnamon-titlebar size: ${height}px - managed by cinnamon-titlebar skill */
.decoration, .titlebar {
    min-height: ${height}px;
    padding: 0 4px !important;
}

.window-buttonbox {
    min-height: ${height}px;
}
TITLEBARCSS
    fi
    
    echo "  Updated cinnamon.css: $css_file"
}

update_metacity_xml() {
    local xml_file="$1"
    local height="$2"
    
    if [ ! -f "$xml_file" ]; then
        echo "  Warning: Metacity theme not found at $xml_file"
        echo "  (Window titlebar buttons may not resize)"
        return 1
    fi
    
    # Calculate button size (roughly half of titlebar height for good proportion)
    local button_size=$((height / 2))
    local title_padding=$((height / 5))
    
    # Update title_vertical_pad
    sed -i "s/title_vertical_pad\" value=\"[0-9]*\"/title_vertical_pad\" value=\"${title_padding}\"/g" "$xml_file" 2>/dev/null
    
    # Update button dimensions
    sed -i "s/button_width\" value=\"[0-9]*\"/button_width\" value=\"${button_size}\"/g" "$xml_file" 2>/dev/null
    sed -i "s/button_height\" value=\"[0-9]*\"/button_height\" value=\"${button_size}\"/g" "$xml_file" 2>/dev/null
    
    echo "  Updated metacity-theme-1.xml: $xml_file"
}

main() {
    local height="${HEIGHT}"
    
    # Validate input
    if [ -z "$height" ]; then
        echo "Usage: $0 <height_in_pixels>"
        echo "Example: $0 24"
        echo ""
        echo "Presets:"
        echo "  24 - Small (compact)"
        echo "  30 - Normal (default)"
        echo "  36 - Large (tall)"
        exit 1
    fi
    
    if ! [[ "$height" =~ ^[0-9]+$ ]]; then
        echo "Error: Height must be a positive integer"
        exit 1
    fi
    
    echo "Setting Cinnamon titlebar to ${height}px..."
    
    # Get active theme
    local theme
    theme=$(get_active_theme)
    
    if [ -z "$theme" ]; then
        echo "Error: Could not determine active theme"
        exit 1
    fi
    
    echo "Active theme: $theme"
    
    # Update Cinnamon CSS
    local css_file
    css_file=$(find_cinnamon_css "$theme")
    
    if [ -n "$css_file" ] && [ -z "$WINDOW_ONLY" ]; then
        update_cinnamon_css "$css_file" "$height"
    else
        echo "  Skipping cinnamon.css (not found or --window-only mode)"
    fi
    
    # Update Metacity theme for window borders
    local xml_file
    xml_file=$(find_metacity_xml "$theme")
    
    if [ -n "$xml_file" ] && [ -z "$WINDOW_ONLY" ]; then
        update_metacity_xml "$xml_file" "$height"
    else
        echo "  Skipping metacity-theme-1.xml (not found or --window-only mode)"
    fi
    
    echo ""
    echo "Done! Restart Cinnamon to apply:"
    echo "  Press Alt+F2, type 'r', and press Enter"
}

main