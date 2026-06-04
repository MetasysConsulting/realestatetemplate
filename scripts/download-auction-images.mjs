#!/usr/bin/env node
/**
 * Download auction property thumbnails from Pexels into image-review/ for approval.
 * Usage: node scripts/download-auction-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUCTION_IMAGE_SOURCES,
  pexelsDownloadUrl,
  pexelsPageUrl,
} from "./auction-image-sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "image-review", "auction-properties");

async function downloadOne(source) {
  const dest = path.join(OUT_DIR, source.file);
  const url = pexelsDownloadUrl(source.pexelsId);

  const res = await fetch(url, {
    headers: { "User-Agent": "REOVANA-image-review/1.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`${source.file}: HTTP ${res.status} from ${url}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  const stat = await fs.stat(dest);
  return { ...source, bytes: stat.size, sourceUrl: url, pexelsPage: pexelsPageUrl(source.pexelsId) };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const source of AUCTION_IMAGE_SOURCES) {
    process.stdout.write(`Downloading ${source.file}… `);
    try {
      const row = await downloadOne(source);
      results.push(row);
      console.log(`OK (${(row.bytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log("FAILED");
      throw err;
    }
  }

  const manifest = {
    downloadedAt: new Date().toISOString(),
    license: "Pexels License — free for commercial use; attribution appreciated",
    licenseUrl: "https://www.pexels.com/license/",
    count: results.length,
    images: results.map((r) => ({
      file: r.file,
      label: r.label,
      categories: r.categories,
      pexelsId: r.pexelsId,
      photographer: r.photographer,
      pexelsPage: r.pexelsPage,
      bytes: r.bytes,
    })),
  };

  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`\nDone. ${results.length} images → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
