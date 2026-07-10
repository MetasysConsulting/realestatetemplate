"use client";

import { SidebarProvider, SidebarInset } from "@/components/admin/ui/sidebar";
import LeftSidebar from "./leftsidebar";
import Footer from "./footer";
import Header from "./header";
import useScrollToTop from "@/hooks/admin/useScrollToTop";
import type { AdminShellUser } from "@/components/admin/app-shell";

const Layout = ({
  children,
  adminUser,
}: {
  children: React.ReactNode;
  adminUser: AdminShellUser;
}) => {
  useScrollToTop();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width-icon": "7rem",
        } as React.CSSProperties
      }
    >
      <LeftSidebar adminUser={adminUser} />
      <SidebarInset>
        <Header adminUser={adminUser} />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <div className="p-5 reovana-admin-shell">{children}</div>
          <Footer />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
