import type { Metadata } from "next";
import { GovernmentDispositionsPageContent } from "@/components/auctions/GovernmentDispositionsPageContent";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Government Disposition — REOVANA",
  description:
    "Browse federal real property identified for accelerated disposition by the U.S. General Services Administration.",
};

export default async function GovernmentDispositionPage() {
  return <GovernmentDispositionsPageContent />;
}
