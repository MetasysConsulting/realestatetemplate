"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { SidebarTrigger } from "@/components/admin/ui/sidebar";
import { Button } from "@/components/admin/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  UserCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";
import { adminLogoutAction } from "@/app/admin/actions";
import type { AdminShellUser } from "@/components/admin/app-shell";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";

const Header = ({ adminUser }: { adminUser: AdminShellUser }) => {
  const [isPending, startTransition] = useTransition();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = () => {
    startTransition(() => {
      void adminLogoutAction();
    });
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-linear-to-r from-primary to-sidebar-primary backdrop-blur mx-5 md:mx-10 rounded-b-2xl px-4 md:px-6">
      <div className="absolute w-full h-full rounded-l-2xl top-0 left-0 pointer-events-none">
        <svg className="absolute left-[-30px] top-0 svg-corner rotate-90" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_310_2)"><path d="M30 0H0V30C0 13.431 13.431 0 30 0Z"></path></g><defs><clipPath id="clip0_310_2"><rect width="30" height="30" fill="white"></rect></clipPath></defs></svg>
        <svg className="absolute right-[-30px] top-0 rotate- svg-corner svg-pink" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_310_3)"><path d="M30 0H0V30C0 13.431 13.431 0 30 0Z"></path></g><defs><clipPath id="clip0_310_3"><rect width="30" height="30" fill="white"></rect></clipPath></defs></svg>
      </div>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <SidebarTrigger />
        <AdminGlobalSearch className="w-full max-w-md hidden md:block" />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSearchOpen((v) => !v)}
          aria-label="Toggle search"
        >
          <Search className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative group text-white/90 hover:bg-white/10 hover:text-white"
            >
              <Bell className="size-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-white/70">Admin alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-6 text-center">
              <p className="text-sm font-medium text-white/90">No alerts yet</p>
              <p className="mt-1 text-xs text-white/50">
                System notifications will appear here when available.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full group hover:bg-white/10"
            >
              <div className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all duration-300 group-hover:border-white/35 group-hover:bg-white/15">
                <UserCircle className="size-5 text-white transition-transform duration-300" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5 px-0.5 py-0.5">
                <p className="truncate text-sm font-semibold text-white">
                  {adminUser.fullName}
                </p>
                <p className="truncate text-xs text-white/55">{adminUser.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#9eb4f0]">
                  {adminUser.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <User /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={REOVANA_BRAND.localPublicSiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Public site
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="opacity-45">
              <HelpCircle /> Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              disabled={isPending}
            >
              <LogOut />
              {isPending ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mobileSearchOpen ? (
        <div className="absolute left-4 right-4 top-[calc(100%+0.5rem)] md:hidden z-50">
          <AdminGlobalSearch compact className="w-full" />
        </div>
      ) : null}
    </header>
  );
};

export default Header;
