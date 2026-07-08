#!/usr/bin/env node
/**
 * Live dashboard for PropertyRadar HTML scrape (read-only, safe while scraper runs).
 *
 * Usage:
 *   pnpm scrape-propertyradar-watch
 */
import fs from "fs";
import {
  PROGRESS_JSON,
  countHtmlSnapshots,
} from "./lib/propertyradar-scraper-progress.mjs";

const INTERVAL_MS = Number(process.env.WATCH_INTERVAL_MS) || 1000;
const GOAL = Number(process.env.SCRAPE_GOAL) || 5000;
const BATCH_SIZE = Number(process.env.SCRAPE_BATCH_SIZE) || 500;
const PACE_WINDOW = 20;

function readProgressFile() {
  if (!fs.existsSync(PROGRESS_JSON)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_JSON, "utf8"));
  } catch {
    return null;
  }
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
  const perMin = 60 / secPerSave;
  return { secPerSave, perMin };
}

function render() {
  const total = countHtmlSnapshots();
  const progress = readProgressFile();
  const goal = progress?.goal ?? GOAL;
  const batchTarget = progress?.batchTarget ?? progress?.batchSize ?? BATCH_SIZE;
  const batchSaved = progress?.batchSaved ?? 0;
  const batchLeft = Math.max(0, batchTarget - batchSaved);
  const totalLeft = Math.max(0, goal - total);
  const errors = progress?.batchErrors ?? 0;
  const last =
    progress?.lastAddress && progress?.lastCity
      ? `${progress.lastAddress}, ${progress.lastCity}`
      : "—";
  const updated = progress?.updatedAt
    ? new Date(progress.updatedAt).toLocaleTimeString()
    : "—";
  const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
  const pace = paceStats();

  let etaBatch = null;
  let etaGoal = null;
  let paceLine = "calculating… (need a few saves)";
  if (pace) {
    etaBatch = batchLeft * pace.secPerSave;
    etaGoal = totalLeft * pace.secPerSave;
    paceLine = `${pace.perMin.toFixed(1)}/min  (~${pace.secPerSave.toFixed(0)}s per save)`;
  } else if (total > 0 && elapsed > 30) {
    const rough = elapsed / total;
    paceLine = `~${(60 / rough).toFixed(1)}/min  (rough, warming up)`;
    etaBatch = batchLeft * rough;
    etaGoal = totalLeft * rough;
  }

  console.clear();
  console.log("PropertyRadar HTML scrape — LIVE");
  console.log("─".repeat(52));
  console.log(`TOTAL       ${total} / ${goal}   (${pct(total, goal)})`);
  console.log(`THIS BATCH  ${batchSaved} / ${batchTarget}   (${batchLeft} left)`);
  console.log(`ERRORS      ${errors} this batch`);
  console.log(`PACE        ${paceLine}`);
  console.log(`ETA BATCH   ${formatEta(etaBatch)}   → finish this ${batchTarget}`);
  console.log(`ETA ALL     ${formatEta(etaGoal)}   → finish all ${goal}`);
  console.log(`LAST SAVE   ${last}`);
  console.log(`SCRAPER     ${updated === "—" ? "idle or starting…" : `active · ${updated}`}`);
  console.log("─".repeat(52));
  console.log("Ctrl+C to close this window (scraper keeps running)");
}

console.log("Starting live dashboard…\n");
setTimeout(() => {
  const tick = () => {
    noteSave(Date.now(), countHtmlSnapshots());
    render();
  };
  tick();
  setInterval(tick, INTERVAL_MS);
}, 300);
