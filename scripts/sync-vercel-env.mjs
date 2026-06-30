/**
 * Sync listing-related env vars from .env.local to Vercel production.
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env.local");

const KEYS = [
  "NEXT_PUBLIC_REOVANA_BACKEND_ENABLED",
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_USE_SUPABASE_LISTINGS",
];

function parseEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    values[key] = value;
  }

  return values;
}

function main() {
  const env = parseEnvFile(ENV_FILE);
  const missing = KEYS.filter((key) => !env[key]);
  if (missing.length === KEYS.length) {
    throw new Error(`No listing env vars found in ${ENV_FILE}`);
  }

  for (const key of KEYS) {
    const value = env[key];
    if (!value) {
      console.log(`skip ${key} (not in .env.local)`);
      continue;
    }

    console.log(`setting ${key} on Vercel production...`);
    try {
      execFileSync("npx", ["vercel", "env", "rm", key, "production", "--yes"], {
        cwd: ROOT,
        stdio: "ignore",
      });
    } catch {
      // Variable may not exist yet.
    }
    execFileSync("npx", ["vercel", "env", "add", key, "production"], {
        cwd: ROOT,
        input: value,
        stdio: ["pipe", "inherit", "inherit"],
      },
    );
  }

  console.log("Done. Redeploy production for changes to take effect.");
}

main();
