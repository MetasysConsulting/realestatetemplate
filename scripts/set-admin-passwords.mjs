/**
 * One-time: set default admin password + app_metadata.role for allowlisted accounts.
 *
 * Usage:
 *   node --env-file=.env.local scripts/set-admin-passwords.mjs
 *
 * Default password is only used here — change it in Admin → Settings after first login.
 */
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = "Reovana123$";
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  "creditteck1@gmail.com,metasysprojects@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE URL or SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log("Setting admin passwords for:", ADMIN_EMAILS.join(", "));

  for (const email of ADMIN_EMAILS) {
    const user = await findUserByEmail(email);
    if (!user) {
      console.error(`  ✗ ${email} — not found in auth.users`);
      continue;
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role: "admin",
      },
    });

    if (error) {
      console.error(`  ✗ ${email} — ${error.message}`);
      continue;
    }
    console.log(`  ✓ ${email} — password set, role=admin`);
  }

  console.log("Done. Sign in at /admin/login and change the password in Settings.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
