import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getPropertyById, properties } from "@/lib/properties";

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = getPropertyById(id);
  return { title: property?.title ?? "Property" };
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = getPropertyById(id);

  if (!property) {
    notFound();
  }

  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <h1 className="title">{property.title}</h1>
          <p className="location text-1">
            <i className="icon-location" /> {property.location}
          </p>
        </div>
      </div>

      <section className="tf-spacing-1">
        <div className="tf-container">
          <div className="row g-30">
            <div className="col-lg-8">
              <img
                src={property.image}
                alt={property.title}
                style={{ borderRadius: 12, width: "100%" }}
              />
              <div className="mt-20">
                <h3>Overview</h3>
                <p className="text-1">
                  Stunning property in a prime Hawaii location. This listing
                  includes {property.beds} bedrooms, {property.baths} bathrooms,
                  and {property.sqft.toLocaleString()} sqft of living space.
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div
                className="p-20"
                style={{
                  background: "var(--Sub-primary-1)",
                  borderRadius: 12,
                }}
              >
                <h4 className="price mb-12">{property.price}</h4>
                <ul className="meta-list flex flex-column gap-8">
                  <li className="text-1">
                    <span>{property.beds}</span> Beds
                  </li>
                  <li className="text-1">
                    <span>{property.baths}</span> Baths
                  </li>
                  <li className="text-1">
                    <span>{property.sqft.toLocaleString()}</span> Sqft
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="tf-btn bg-color-primary w-full pd-23 mt-20"
                  style={{ display: "block", textAlign: "center" }}
                >
                  Schedule a tour
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-30">
            <Link href="/properties" className="tf-btn style-border pd-4">
              ← Back to listings
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
