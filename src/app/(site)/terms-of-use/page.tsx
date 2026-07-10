import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { TERMS_OF_USE_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Use — REOVANA",
  description: "Terms and conditions for using the REOVANA website and services.",
};

export default function TermsOfUsePage() {
  return (
    <LegalPageShell>
      <LegalDocument
        title="Terms of Use"
        intro="Please read these terms carefully before using REOVANA. By using the site, you agree to be bound by them."
        sections={TERMS_OF_USE_SECTIONS}
      />
    </LegalPageShell>
  );
}
