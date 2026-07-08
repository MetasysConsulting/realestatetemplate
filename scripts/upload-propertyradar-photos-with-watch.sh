#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! pgrep -f "watch-propertyradar-photo-upload-progress" >/dev/null 2>&1; then
  osascript - "$ROOT" <<'APPLESCRIPT'
on run argv
  set projectRoot to item 1 of argv
  tell application "Terminal"
    activate
    do script "cd " & quoted form of projectRoot & " && pnpm upload-propertyradar-photos-watch"
  end tell
end run
APPLESCRIPT
  sleep 1
fi

exec node --env-file=.env.local "$ROOT/scripts/upload-propertyradar-photos-to-storage.mjs" "$@"
