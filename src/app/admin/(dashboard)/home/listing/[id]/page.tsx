import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy stub route — send operators to the real listings detail page. */
export default async function LegacyAdminListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/listings/${encodeURIComponent(id)}`);
}
