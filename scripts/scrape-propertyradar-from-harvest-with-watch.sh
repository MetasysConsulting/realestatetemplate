#!/usr/bin/env bash
# Visit detail pages from list-harvest.json + open live HTML scrape dashboard.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/open-propertyradar-watch-terminal.sh"
sleep 1
exec node --env-file=.env.local "$ROOT/scripts/scrape-propertyradar-images-pilot.mjs" \
  --from-harvest --html-only --resume --batch-size 500 --goal 9064 --auto-continue --no-stop-on-error
