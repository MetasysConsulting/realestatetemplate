import Members from "@/views/admin/members";
import { fetchAdminMembersData } from "@/lib/admin/admin-members";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const data = await fetchAdminMembersData();
  return <Members data={data} />;
}
