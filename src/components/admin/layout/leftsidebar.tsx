"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/admin/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import { Card } from "@/components/admin/ui/card";
import {
  LayoutDashboard,
  Wand2,
  Bot,
  CreditCard,
  Settings2,
  Activity,
  Gem,
  Home,
  Database,
  Building2,
  Users,
  Mail,
} from "lucide-react";
import { ReovanaLogo } from "@/components/admin/reovana-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin/ui/button";
import type { AdminShellUser } from "@/components/admin/app-shell";

const SIDEBAR_WIDTH_ICON = "7rem";

const menuItems = [
  { title: "Activity", path: "/admin/home", icon: Home },
  { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Listings", path: "/admin/listings", icon: Building2 },
  { title: "Data Sources", path: "/admin/data-sources", icon: Database },
  { title: "Manage Members", path: "/admin/members", icon: Users },
  { title: "Email Management", path: "/admin/emails", icon: Mail },
  { title: "Listing Tools", path: "/admin/content-tools", icon: Wand2 },
  { title: "Admin AI", path: "/admin/chatbot", icon: Bot },
  { title: "Inventory Analytics", path: "/admin/analytics", icon: Activity },
  { title: "Plans & Billing", path: "/admin/subscription", icon: CreditCard },
  { title: "Settings", path: "/admin/settings", icon: Settings2 },
];

const LeftSidebar = ({ adminUser }: { adminUser: AdminShellUser }) => {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          "--sidebar-width": SIDEBAR_WIDTH_ICON,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="overflow-visible">
        <div className="hidden xl:flex flex-col items-center px-1 py-4 overflow-visible">
          <ReovanaLogo size="lg" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Admin</span>
        </div>
        <div className="xl:hidden flex flex-col items-center justify-center px-2 py-4 overflow-visible">
          <ReovanaLogo size="lg" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.path || pathname.startsWith(`${item.path}/`)}
                  >
                    <Link href={item.path} onClick={handleMenuClick}>
                      <item.icon />
                      <span className="xl:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="hidden xl:block px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-sidebar-accent">
                <div className="flex items-center justify-center size-10 rounded-full bg-sidebar-foreground">
                  <Gem className="size-5 text-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-72">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-sm font-semibold text-white">
                    {adminUser.fullName}
                  </p>
                  <p className="truncate text-xs text-white/55">{adminUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  size="sm"
                  asChild
                >
                  <Link href="/admin/settings">Account settings</Link>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="xl:hidden px-3 pb-3">
          <Card className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-white">{adminUser.fullName}</p>
              <p className="text-xs text-muted-foreground break-all">{adminUser.email}</p>
            </div>
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/admin/settings" onClick={handleMenuClick}>
                Account settings
              </Link>
            </Button>
          </Card>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default LeftSidebar;
