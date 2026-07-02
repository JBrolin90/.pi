#!/usr/bin/env bash
# Dump a useful snapshot of the current tab to stdout:
# title, URL, button/input/link counts, and the visible text of
# interactive elements (buttons + links).
#
# Use this before any click to make sure the page is what you expect.

set -euo pipefail

BROWSER_DIR=""
for candidate in \
  "$HOME/.pi/agent/skills/pi-skills/browser-tools" \
  "$HOME/.pi/agent/skills/browser-tools"; do
  if [[ -f "$candidate/browser-eval.js" ]]; then
    BROWSER_DIR="$candidate"
    break
  fi
done

if [[ -z "$BROWSER_DIR" ]]; then
  echo "Error: browser-tools skill not found." >&2
  exit 1
fi

EVAL="$BROWSER_DIR/browser-eval.js"

node "$EVAL" '(function() {
  const interactives = Array.from(document.querySelectorAll("button, a, input, [role=button]"))
    .slice(0, 50)
    .map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.type || null,
      text: (el.innerText || el.value || el.placeholder || "").trim().slice(0, 80),
      href: el.getAttribute("href") || null,
      id: el.id || null,
    }))
    .filter(x => x.text.length > 0);
  return JSON.stringify({
    title: document.title,
    url: location.href,
    pathname: location.pathname,
    counts: {
      buttons: document.querySelectorAll("button").length,
      links: document.querySelectorAll("a").length,
      inputs: document.querySelectorAll("input").length,
    },
    interactives,
  }, null, 2);
})()'
