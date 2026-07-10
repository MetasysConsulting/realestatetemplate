import ListingDetail from "@/views/admin/listing-detail";
import { fetchAdminListingById } from "@/lib/admin/admin-listing-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchAdminListingById(decodeURIComponent(id));
  return <ListingDetail data={data} />;
}
