"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/admin/ui/sidebar";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/admin/ui/dropdown-menu";
import { Search, Bell, User, Settings, LogOut, HelpCircle, UserCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { ADMIN_NOTIFICATIONS, REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";

const Header = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-linear-to-r from-primary to-sidebar-primary backdrop-blur mx-5 md:mx-10 rounded-b-2xl px-4 md:px-6">
      <div className="absolute w-full h-full rounded-l-2xl top-0 left-0 pointer-events-none">
        <svg className="absolute left-[-30px] top-0 svg-corner rotate-90" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_310_2)"><path d="M30 0H0V30C0 13.431 13.431 0 30 0Z"></path></g><defs><clipPath id="clip0_310_2"><rect width="30" height="30" fill="white"></rect></clipPath></defs></svg>
        <svg className="absolute right-[-30px] top-0 rotate- svg-corner svg-pink" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_310_3)"><path d="M30 0H0V30C0 13.431 13.431 0 30 0Z"></path></g><defs><clipPath id="clip0_310_3"><rect width="30" height="30" fill="white"></rect></clipPath></defs></svg>
      </div>
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input type="search" placeholder="Search listings, feeds, users..." className="pl-9 h-9" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="size-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Admin alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {ADMIN_NOTIFICATIONS.map((n) => (
                <DropdownMenuItem key={n.title + n.time}>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.detail}</p>
                    <p className="text-xs text-muted-foreground/80">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full group">
              <div className="flex items-center justify-center size-8 rounded-full bg-sidebar-accent border border-sidebar-accent transition-all duration-300 group-hover:shadow-lg">
                <UserCircle className="size-5 text-white transition-transform duration-300" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{REOVANA_BRAND.adminUser.name}</p>
                <p className="text-xs text-muted-foreground">{REOVANA_BRAND.adminUser.email}</p>
                <p className="text-xs text-primary">{REOVANA_BRAND.adminUser.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings"><User className="" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings"><Settings className="" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={REOVANA_BRAND.localPublicSiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="" /> Public site
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="" /> Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="text-destructive" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
