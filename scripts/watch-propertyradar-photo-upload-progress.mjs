#!/usr/bin/env node
/**
 * Live counter for PropertyRadar photo → Supabase Storage upload.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PILOT_ROOT } from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.join(PILOT_ROOT, "photo-upload-progress.json");
const INTERVAL_MS = Number(process.env.WATCH_INTERVAL_MS) || 1000;

function readProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "calculating…";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function pct(n, d) {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function bar(processed, goal, width = 32) {
  if (!goal) return "[" + " ".repeat(width) + "]";
  const filled = Math.min(width, Math.round((processed / goal) * width));
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

let startedAt = Date.now();
let lastIndex = -1;

function render() {
  const p = readProgress();
  if (!p) {
    console.clear();
    console.log("PropertyRadar photo upload — waiting for progress…");
    return;
  }

  if (lastIndex < 0 && p.processedIndex > 0) {
    startedAt = Date.now();
    lastIndex = p.processedIndex;
  } else if (p.processedIndex > lastIndex) {
    lastIndex = p.processedIndex;
  }

  const goal = p.goal ?? 0;
  const processed = p.processedIndex ?? 0;
  const uploaded = p.uploaded ?? 0;
  const left = Math.max(0, goal - processed);
  const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
  const pace = processed > 0 ? elapsed / processed : null;
  const eta = p.etaMinutes != null ? p.etaMinutes * 60 : pace ? left * pace : null;

  console.clear();
  console.log("PropertyRadar photos → Supabase Storage — LIVE");
  console.log("─".repeat(52));
  console.log(`PROGRESS    ${processed} / ${goal}   (${pct(processed, goal)})`);
  console.log(`            ${bar(processed, goal)}`);
  console.log(`UPLOADED    ${uploaded}`);
  console.log(`SKIPPED     ${p.skipped ?? 0}`);
  console.log(`ERRORS      ${p.errors ?? 0}`);
  console.log(`PACE        ${pace ? `${((processed / elapsed) * 60).toFixed(1)}/min` : "warming up…"}`);
  console.log(`ETA         ${formatEta(eta)}`);
  console.log(`STATUS      ${p.status ?? "—"} · ${p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString() : "—"}`);
  console.log("─".repeat(52));
  console.log("Ctrl+C closes this window (upload keeps running)");
}

console.log("Starting photo upload counter…\n");
setInterval(render, INTERVAL_MS);
setTimeout(render, 200);
