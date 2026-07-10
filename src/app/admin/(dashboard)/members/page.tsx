import Members from "@/views/admin/members";
import { fetchAdminMembersData } from "@/lib/admin/admin-members";
import { parseAdminMembersQuery } from "@/lib/admin/admin-members-types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = parseAdminMembersQuery(params);
  const data = await fetchAdminMembersData(query);
  return <Members data={data} />;
}
