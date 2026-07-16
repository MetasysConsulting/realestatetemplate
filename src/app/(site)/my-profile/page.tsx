import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/auth/AccountSettingsForm";
import { MyUnlocksPanel } from "@/components/auth/MyUnlocksPanel";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Account Settings — REOVANA",
};

export default function MyProfilePage() {
  return (
    <MemberDashboardShell
      activeHref="/my-profile"
      title="Account settings"
      subtitle="Manage your name, phone, password, and listing unlocks."
    >
      <div className="reovana-account-page__stack">
        <AccountSettingsForm />
        <MyUnlocksPanel />
      </div>
    </MemberDashboardShell>
  );
}
