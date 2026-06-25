#!/usr/bin/env node
/**
 * Live dashboard for PropertyRadar → Supabase batch upload.
 */
import fs from "fs";
import { UPLOAD_PROGRESS_FILE } from "./lib/propertyradar-supabase-batch.mjs";

const INTERVAL_MS = Number(process.env.WATCH_INTERVAL_MS) || 1000;

function readProgress() {
  if (!fs.existsSync(UPLOAD_PROGRESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(UPLOAD_PROGRESS_FILE, "utf8"));
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

let startedAt = Date.now();
let lastIndex = -1;
let lastTime = Date.now();

function render() {
  const p = readProgress();
  if (!p) {
    console.clear();
    console.log("PropertyRadar Supabase upload — waiting for progress…");
    return;
  }

  if (p.status === "running" && lastIndex >= 0 && p.processedIndex > lastIndex) {
    lastTime = Date.now();
    lastIndex = p.processedIndex;
  } else if (lastIndex < 0 && p.processedIndex > 0) {
    lastIndex = p.processedIndex;
    startedAt = Date.now();
  }

  const goal = p.goal ?? 0;
  const processed = p.processedIndex ?? 0;
  const uploaded = p.uploaded ?? 0;
  const left = Math.max(0, goal - processed);
  const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
  const pace = processed > 0 ? elapsed / processed : null;
  const eta = pace ? left * pace : null;

  const cats = p.categoryCounts ?? {};
  const catLine = Object.entries(cats)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  |  ");

  console.clear();
  console.log("PropertyRadar → Supabase upload — LIVE");
  console.log("─".repeat(52));
  console.log(`BATCH       ${p.importSource ?? "—"}`);
  console.log(`PROCESSED   ${processed} / ${goal}   (${pct(processed, goal)})`);
  console.log(`UPLOADED    ${uploaded} rows to Supabase`);
  console.log(`SKIPPED     ${p.skipped ?? 0} (no HTML)`);
  console.log(`ERRORS      ${p.errors ?? 0}`);
  console.log(`PHOTOS      ${p.photos ?? 0}`);
  console.log(`PACE        ${pace ? `${(60 / pace).toFixed(1)}/min` : "warming up…"}`);
  console.log(`ETA         ${formatEta(eta)}`);
  console.log(`CATEGORIES  ${catLine || "—"}`);
  console.log(`LAST        ${p.lastAddress ?? "—"}, ${p.lastCity ?? ""}`);
  console.log(`STATUS      ${p.status ?? "—"} · ${p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString() : "—"}`);
  console.log("─".repeat(52));
  console.log("Ctrl+C closes this window (upload keeps running)");
}

console.log("Starting upload dashboard…\n");
setInterval(render, INTERVAL_MS);
setTimeout(render, 200);
