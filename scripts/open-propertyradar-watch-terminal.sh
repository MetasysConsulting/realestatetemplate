#!/usr/bin/env bash
# Opens a new macOS Terminal window with the live progress dashboard (once).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if pgrep -f "watch-propertyradar-progress" >/dev/null 2>&1; then
  echo "Progress dashboard already running — skipping new terminal."
  exit 0
fi

osascript - "$ROOT" <<'APPLESCRIPT'
on run argv
  set projectRoot to item 1 of argv
  tell application "Terminal"
    activate
    do script "cd " & quoted form of projectRoot & " && pnpm scrape-propertyradar-watch"
  end tell
end run
APPLESCRIPT
