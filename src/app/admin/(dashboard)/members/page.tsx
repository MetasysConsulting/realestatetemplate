import Members from "@/views/admin/members";
import { fetchAdminMembersData } from "@/lib/admin/admin-members";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qRaw = params.q;
  const initialQuery = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? "";
  const data = await fetchAdminMembersData();
  return <Members data={data} initialQuery={initialQuery} />;
}
