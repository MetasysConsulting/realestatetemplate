#!/usr/bin/env bash
# Start full radar-ID harvest + open live progress dashboard in a new Terminal window.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/open-harvest-watch-terminal.sh"
sleep 1
exec node --env-file=.env.local "$ROOT/scripts/harvest-propertyradar-ids.mjs" --all
