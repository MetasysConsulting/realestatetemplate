#!/usr/bin/env bash
# Start supervised scrape + open live progress dashboard in a new Terminal window.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/open-propertyradar-watch-terminal.sh"
sleep 1
exec bash "$ROOT/scripts/scrape-propertyradar-supervised.sh"
