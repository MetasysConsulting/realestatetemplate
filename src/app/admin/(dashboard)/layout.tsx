import AppShell from "@/components/admin/app-shell";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  let fullName = admin.fullName;
  let phone: string | null = null;
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", admin.id)
      .maybeSingle();
    if (data?.full_name?.trim()) {
      fullName = data.full_name.trim();
    }
    phone = data?.phone ?? null;
  } catch {
    /* profile optional */
  }

  return (
    <AppShell
      adminUser={{
        id: admin.id,
        email: admin.email,
        fullName,
        role: admin.role,
        phone,
      }}
    >
      {children}
    </AppShell>
  );
}
