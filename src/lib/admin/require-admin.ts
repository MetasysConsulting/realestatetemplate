import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import type { User } from "@supabase/supabase-js";

export type AdminSessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export function toAdminSessionUser(user: User): AdminSessionUser {
  const meta = user.user_metadata ?? {};
  const fullName =
    String(meta.full_name ?? meta.name ?? "").trim() ||
    user.email?.split("@")[0] ||
    "Admin";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    role: "Site Administrator",
  };
}

export async function getAdminUserOrNull(): Promise<AdminSessionUser | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return toAdminSessionUser(user);
}

export async function requireAdminUser(): Promise<AdminSessionUser> {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
