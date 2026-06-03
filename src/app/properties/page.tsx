import Link from "next/link";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { properties } from "@/lib/properties";

type PropertiesPageProps = {
  searchParams: Promise<{ view?: string; type?: string; q?: string }>;
};

export const metadata = {
  title: "Properties",
};

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const view = params.view ?? "grid";
  const query = params.q?.toLowerCase() ?? "";

  const filtered = query
    ? properties.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query),
      )
    : properties;

  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <div className="row">
            <div className="col-12">
              <div className="content-inner">
                <h1 className="title">Property listings</h1>
                <p className="text-1">
                  {filtered.length} properties
                  {query ? ` matching “${params.q}”` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section-listing tf-spacing-1">
        <div className="tf-container">
          <div className="row mb-20">
            <div className="col-12 flex gap-8" style={{ display: "flex", gap: 12 }}>
              <Link
                href="/properties"
                className={`tf-btn ${view !== "list" ? "bg-color-primary" : "style-border"} pd-4`}
              >
                Grid
              </Link>
              <Link
                href="/properties?view=list"
                className={`tf-btn ${view === "list" ? "bg-color-primary" : "style-border"} pd-4`}
              >
                List
              </Link>
            </div>
          </div>
          <div
            className={
              view === "list"
                ? "row g-30"
                : "row tf-layout-mobile-md md-col-2 lg-col-3 g-30"
            }
          >
            {filtered.map((property) => (
              <div
                key={property.id}
                className={view === "list" ? "col-12" : "col-md-6 col-lg-4"}
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
