import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "REOVANA Admin",
  description: "Admin dashboard for REOVANA distressed property marketplace",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="admin-root dark antialiased font-sans">{children}</div>;
}
