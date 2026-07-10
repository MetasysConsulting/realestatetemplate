"use client";

import { SidebarProvider, SidebarInset } from "@/components/admin/ui/sidebar";
import LeftSidebar from "./leftsidebar";
import Footer from "./footer";
import Header from "./header";
import { usePathname } from "next/navigation";
import useScrollToTop from "@/hooks/admin/useScrollToTop";

const Layout = ({ children }: { children: React.ReactNode }) => {
    useScrollToTop()
    const pathname = usePathname()
    const isChatbotPage = pathname === "/admin/chatbot" || pathname.startsWith("/admin/chatbot/")

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width-icon": "7rem",
                } as React.CSSProperties
            }
        >
            <LeftSidebar />
            <SidebarInset>
                <Header />
                <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
                    <div className="p-5 reovana-admin-shell">
                        {children}
                    </div>
                    {!isChatbotPage && <Footer />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default Layout;
