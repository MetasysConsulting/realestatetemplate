"use client";

import Layout from "@/components/admin/layout/layout";
import type { AdminSessionUser } from "@/lib/admin/require-admin";

export type AdminShellUser = AdminSessionUser & {
  phone?: string | null;
};

export default function AppShell({
  children,
  adminUser,
}: {
  children: React.ReactNode;
  adminUser: AdminShellUser;
}) {
  return <Layout adminUser={adminUser}>{children}</Layout>;
}
