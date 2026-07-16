/**
 * Create/update allowlisted admin Auth users with the default password.
 *
 * Usage:
 *   node --env-file=.env.local scripts/set-admin-passwords.mjs
 *   node --env-file=.env.local scripts/set-admin-passwords.mjs management@reovana.com
 *
 * Default password is only for first login — change it in Admin → Settings after.
 */
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = "Reovana123$";
const DEFAULT_ADMIN_EMAILS =
  "creditteck1@gmail.com,metasysprojects@gmail.com,management@reovana.com";

const args = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAILS = (
  args.length
    ? args.join(",")
    : process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS
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

async function ensureAdminUser(email) {
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  ✓ ${email} — created + password set, role=admin`);
    return;
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    app_metadata: {
      ...(user.app_metadata ?? {}),
      role: "admin",
    },
  });

  if (error) throw error;
  console.log(`  ✓ ${email} — password set, role=admin`);
}

async function main() {
  console.log("Setting admin passwords for:", ADMIN_EMAILS.join(", "));

  for (const email of ADMIN_EMAILS) {
    try {
      await ensureAdminUser(email);
    } catch (err) {
      console.error(`  ✗ ${email} — ${err.message || err}`);
    }
  }

  console.log("Done. Sign in at /admin/login and change the password in Settings.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
