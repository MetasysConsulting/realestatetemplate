import Listings from "@/views/admin/listings";
import { fetchAdminListingsData } from "@/lib/admin/admin-listings";
import { parseAdminListingsQuery } from "@/lib/admin/admin-listings-types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = parseAdminListingsQuery(params);
  const data = await fetchAdminListingsData(query);
  return <Listings data={data} />;
}
