import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy — REOVANA",
  description: "How REOVANA collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell>
      <LegalDocument
        title="Privacy Policy"
        intro="This policy describes how REOVANA handles personal information when you use our website and related services."
        sections={PRIVACY_POLICY_SECTIONS}
      />
    </LegalPageShell>
  );
}
