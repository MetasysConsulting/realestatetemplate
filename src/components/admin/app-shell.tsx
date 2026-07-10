"use client";

import Layout from "@/components/admin/layout/layout";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
