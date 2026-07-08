#!/usr/bin/env bash
# Runs the PropertyRadar scraper and restarts if no progress for INACTIVITY_MINUTES.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GOAL="${SCRAPE_GOAL:-5000}"
INACTIVITY_MINUTES="${SCRAPE_INACTIVITY_MINUTES:-5}"
POLL_SEC="${SCRAPE_WATCH_POLL_SEC:-30}"
PROGRESS_FILE="$ROOT/data/propertyradar-pilot/progress.json"
SNAPSHOT_DIR="$ROOT/data/propertyradar-pilot/html-snapshots"

count_snapshots() {
  find "$SNAPSHOT_DIR" -maxdepth 1 -name '*.html' ! -name '._*' 2>/dev/null | wc -l | tr -d ' '
}

progress_signature() {
  if [[ -f "$PROGRESS_FILE" ]]; then
    stat -f '%m' "$PROGRESS_FILE" 2>/dev/null || stat -c '%Y' "$PROGRESS_FILE" 2>/dev/null || echo 0
  else
    echo 0
  fi
}

kill_scraper() {
  pkill -f "scrape-propertyradar-images-pilot.mjs" 2>/dev/null || true
  sleep 2
  pkill -9 -f "scrape-propertyradar-images-pilot.mjs" 2>/dev/null || true
}

restart_num=0
stuck_restarts=0
last_activity=$(date +%s)
last_sig="$(progress_signature)"
last_count="$(count_snapshots)"

echo "Supervisor: goal $GOAL snapshots | restart after ${INACTIVITY_MINUTES}m idle"
echo "Snapshots now: $last_count"
echo ""

while [[ "$(count_snapshots)" -lt "$GOAL" ]]; do
  restart_num=$((restart_num + 1))
  echo "━━━ Starting scraper (run #$restart_num) ━━━"
  last_activity=$(date +%s)
  last_sig="$(progress_signature)"
  last_count="$(count_snapshots)"

  pnpm scrape-propertyradar-html &
  scraper_pid=$!

  while kill -0 "$scraper_pid" 2>/dev/null; do
    sleep "$POLL_SEC"

    now=$(date +%s)
    sig="$(progress_signature)"
    count="$(count_snapshots)"

    if [[ "$sig" != "$last_sig" || "$count" != "$last_count" ]]; then
      last_activity=$now
      last_sig="$sig"
      last_count="$count"
    fi

    idle=$((now - last_activity))
    idle_limit=$((INACTIVITY_MINUTES * 60))

    if [[ "$count" -ge "$GOAL" ]]; then
      echo "Goal reached ($count) — stopping supervisor."
      kill_scraper
      exit 0
    fi

    if [[ "$idle" -ge "$idle_limit" ]]; then
      echo ""
      echo "⏱ No progress for ${INACTIVITY_MINUTES} minutes (still at $count snapshots) — restarting…"
      kill_scraper
      wait "$scraper_pid" 2>/dev/null || true
      sleep 3
      break
    fi
  done

  if ! kill -0 "$scraper_pid" 2>/dev/null; then
    wait "$scraper_pid" 2>/dev/null || true
    count="$(count_snapshots)"
    if [[ "$count" -ge "$GOAL" ]]; then
      echo "Goal reached ($count)."
      exit 0
    fi
    if [[ "$count" == "$last_count" ]]; then
      stuck_restarts=$((stuck_restarts + 1))
      echo '{"scrollTop":0,"updatedAt":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > "$ROOT/data/propertyradar-pilot/list-scroll.json"
      if [[ "$stuck_restarts" -ge 5 ]]; then
        echo "Scraper stuck at $count for 5 restarts — pausing 3 minutes…"
        sleep 180
        stuck_restarts=0
      fi
      wait_secs=60
    else
      stuck_restarts=0
      wait_secs=10
    fi
    echo "Scraper exited ($count / $GOAL) — restarting in ${wait_secs}s…"
    sleep "$wait_secs"
  fi
done

echo "Done: $(count_snapshots) / $GOAL snapshots."
