/**
 * Apply SQL migrations to Supabase Postgres.
 * Usage: node --env-file=.env.local scripts/run-supabase-migration.mjs [migration-file]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const defaultMigration = path.join(ROOT, "supabase", "migrations", "001_listings.sql");

const migrationFile = process.argv[2] ? path.resolve(process.argv[2]) : defaultMigration;

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Migration not found: ${migrationFile}`);
  }

  const sql = fs.readFileSync(migrationFile, "utf8");
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Running migration: ${migrationFile}`);
  await client.query(sql);
  console.log("Migration applied successfully");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
