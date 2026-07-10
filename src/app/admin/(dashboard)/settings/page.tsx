import Settings from "@/views/admin/settings";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export default async function AdminSettingsPage() {
  const admin = await requireAdminUser();

  let fullName = admin.fullName;
  let phone = "";
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", admin.id)
      .maybeSingle();
    if (data?.full_name?.trim()) fullName = data.full_name.trim();
    if (data?.phone) phone = data.phone;
  } catch {
    /* optional */
  }

  return (
    <Settings
      adminUser={{
        id: admin.id,
        email: admin.email,
        fullName,
        role: admin.role,
        phone,
      }}
    />
  );
}
