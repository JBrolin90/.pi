#!/bin/bash

EXTENSION_NAME="$1"
if [ -z "$EXTENSION_NAME" ]; then
  echo "Error: Extension name required"
  echo "Usage: $0 <extension-name>"
  exit 1
fi

SRC="$HOME/.pi/agent/extensions/$EXTENSION_NAME"
DEST="$HOME/.pi/agent/inactiveExtensions/$EXTENSION_NAME"

# Check if source exists
if [ ! -e "$SRC" ]; then
  echo "Error: Extension '$EXTENSION_NAME' not found in active extensions"
  exit 1
fi

# Check if already inactive
if [ -e "$DEST" ]; then
  echo "Error: Extension '$EXTENSION_NAME' already exists in inactive extensions"
  exit 1
fi

# Move to inactive
mv "$SRC" "$DEST"
echo "Deactivated: $EXTENSION_NAME"
echo "Run /reload to apply changes"