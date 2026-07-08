/**
 * Live progress counter for bulk PropertyRadar HTML scraping.
 */
import fs from "fs";
import path from "path";
import { PILOT_ROOT } from "./propertyradar-pilot-store.mjs";

export const PROGRESS_JSON = path.join(PILOT_ROOT, "progress.json");
export const HTML_DEBUG_DIR = path.join(PILOT_ROOT, "html-snapshots");

export function countHtmlSnapshots() {
  if (!fs.existsSync(HTML_DEBUG_DIR)) return 0;
  return fs.readdirSync(HTML_DEBUG_DIR).filter((f) => f.endsWith(".html") && !f.startsWith("._")).length;
}

export function writeProgress(state) {
  fs.mkdirSync(PILOT_ROOT, { recursive: true });
  fs.writeFileSync(PROGRESS_JSON, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

export function formatProgressLine(state) {
  const {
    totalSaved,
    goal,
    batchNum,
    batchSaved,
    batchSkipped,
    batchErrors,
    batchSize,
    batchTarget,
    workers,
    lastAddress,
    lastCity,
    status,
  } = state;

  const batchDone = batchSaved + batchSkipped + batchErrors;
  const where = lastAddress ? ` | last: ${lastAddress}, ${lastCity}` : "";
  return (
    `📊 TOTAL ${totalSaved} / ${goal}` +
    `  |  Batch ${batchNum}: ${batchDone}/${batchTarget ?? batchSize} (${batchSaved} saved, ${batchSkipped} skip, ${batchErrors} err)` +
    `  |  ${workers} workers` +
    `  |  ${status}${where}`
  );
}

export function logProgress(state) {
  const line = formatProgressLine(state);
  console.log(line);
  writeProgress(state);
  return line;
}

/** Lightweight heartbeat so watchdog knows scraper is alive (scroll/skip/login). */
export function writeHeartbeat(state) {
  writeProgress({ ...state, status: state.status ?? "running" });
}
