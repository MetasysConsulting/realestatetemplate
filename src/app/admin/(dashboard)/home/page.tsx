import AdminHome from "@/views/admin/admin-home";
import { fetchSiteActivitySummary } from "@/lib/admin/site-activity-analytics";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const activity = await fetchSiteActivitySummary();
  return <AdminHome activity={activity} />;
}
