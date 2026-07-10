import Listings from "@/views/admin/listings";
import { fetchAdminListingsData } from "@/lib/admin/admin-listings";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const data = await fetchAdminListingsData();
  return <Listings data={data} />;
}
