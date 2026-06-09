import type { Metadata } from "next";
import { GovernmentDispositionsPageContent } from "@/components/auctions/GovernmentDispositionsPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Government Disposition — REOVANA",
  description:
    "Browse federal real property identified for accelerated disposition by the U.S. General Services Administration.",
};

export default function GovernmentDispositionPage() {
  return <GovernmentDispositionsPageContent />;
}
