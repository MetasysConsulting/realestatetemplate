#!/usr/bin/env node
/**
 * Live dashboard for PropertyRadar radar-ID harvest (read-only).
 *
 * Usage:
 *   pnpm harvest-propertyradar-watch
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILOT_ROOT = path.join(__dirname, "..", "data", "propertyradar-pilot");
const HARVEST_FILE = path.join(PILOT_ROOT, "list-harvest.json");
const PROGRESS_FILE = path.join(PILOT_ROOT, "harvest-progress.json");

const INTERVAL_MS = Number(process.env.WATCH_INTERVAL_MS) || 1000;
const GOAL = Number(process.env.HARVEST_GOAL) || 9000;
const PACE_WINDOW = 20;

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function countWithRadar() {
  const harvest = readJson(HARVEST_FILE);
  if (!harvest?.listings) return 0;
  return harvest.listings.filter((l) => l.radarId).length;
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "calculating…";
  const totalSec = Math.round(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function pct(n, d) {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const saveTimestamps = [];
let lastCount = -1;
let startedAt = Date.now();

function noteSave(now, count) {
  if (lastCount >= 0 && count > lastCount) {
    for (let i = 0; i < count - lastCount; i++) saveTimestamps.push(now);
    if (saveTimestamps.length > PACE_WINDOW) {
      saveTimestamps.splice(0, saveTimestamps.length - PACE_WINDOW);
    }
  }
  lastCount = count;
}

function paceStats() {
  if (saveTimestamps.length < 2) return null;
  const intervals = [];
  for (let i = 1; i < saveTimestamps.length; i++) {
    intervals.push(saveTimestamps[i] - saveTimestamps[i - 1]);
  }
  const secPerSave = median(intervals) / 1000;
  if (!secPerSave || secPerSave <= 0) return null;
  return { secPerSave, perMin: 60 / secPerSave };
}

function render() {
  const total = countWithRadar();
  const progress = readJson(PROGRESS_FILE);
  const goal = progress?.goal ?? GOAL;
  const addedRun = progress?.addedThisRun ?? 0;
  const left = Math.max(0, goal - total);
  const scrollTop = progress?.scrollTop ?? 0;
  const storeRows = progress?.storeRows ?? 0;
  const skipped = progress?.skippedNoRadarId ?? 0;
  const stagnant = progress?.stagnantPasses ?? 0;
  const status = progress?.status ?? "idle";
  const last =
    progress?.lastAddress && progress?.lastCity
      ? `${progress.lastAddress}, ${progress.lastCity}`
      : "—";
  const updated = progress?.updatedAt
    ? new Date(progress.updatedAt).toLocaleTimeString()
    : "—";
  const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
  const pace = paceStats();

  let etaLine = "calculating… (need a few saves)";
  let etaGoal = null;
  if (pace) {
    etaGoal = left * pace.secPerSave;
    etaLine = `${pace.perMin.toFixed(1)}/min  (~${pace.secPerSave.toFixed(0)}s per batch save)`;
  } else if (total > 0 && elapsed > 30) {
    const rough = elapsed / total;
    etaLine = `~${(60 / rough).toFixed(1)}/min  (rough, warming up)`;
    etaGoal = left * rough;
  }

  console.clear();
  console.log("PropertyRadar radar ID harvest — LIVE");
  console.log("─".repeat(52));
  console.log(`TOTAL       ${total} / ~${goal}   (${pct(total, goal)})`);
  console.log(`THIS RUN    +${addedRun} new IDs saved`);
  console.log(`SCROLL      ${scrollTop}px   store in memory: ${storeRows} rows`);
  console.log(`SKIPPED     ${skipped} rows without radar ID (this run)`);
  console.log(`PACE        ${etaLine}`);
  console.log(`ETA LIST    ${formatEta(etaGoal)}   → ~${goal} with radar ID`);
  console.log(`LAST SAVE   ${last}`);
  console.log(`HARVESTER   ${status === "idle" ? "idle or starting…" : `${status} · ${updated}`}`);
  if (stagnant > 0) console.log(`LIST END    pass ${stagnant}/15 (near bottom)`);
  console.log("─".repeat(52));
  console.log("Ctrl+C to close this window (harvester keeps running)");
}

console.log("Starting harvest dashboard…\n");
setTimeout(() => {
  const tick = () => {
    noteSave(Date.now(), countWithRadar());
    render();
  };
  tick();
  setInterval(tick, INTERVAL_MS);
}, 300);
