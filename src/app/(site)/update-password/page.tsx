import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Update Password — REOVANA",
  description: "Choose a new password for your REOVANA account.",
};

export default function UpdatePasswordPage() {
  return (
    <MemberDashboardShell
      activeHref="/my-profile"
      title="Update password"
      subtitle="Finish resetting your account password."
    >
      <UpdatePasswordForm />
    </MemberDashboardShell>
  );
}
