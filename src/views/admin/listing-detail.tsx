import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatAdminListingsCount,
  formatAdminListingsDate,
} from "@/lib/admin/admin-listings-types";
import type { AdminListingDetailData } from "@/lib/admin/admin-listing-detail-types";
import {
  ArrowLeft,
  ExternalLink,
  Home,
  ImageIcon,
  MapPin,
  Database,
} from "lucide-react";

type ListingDetailProps = {
  data: AdminListingDetailData;
};

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-white text-sm break-words">{value || "—"}</div>
    </div>
  );
}

export default function ListingDetail({ data }: ListingDetailProps) {
  if (!data.available) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/listings"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Listing unavailable"
              description="Could not reach the listings database for this record."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data.listing) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/listings"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Listing not found"
              description="No listing exists with this ID in the database."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const listing = data.listing;
  const location = [listing.city, listing.state, listing.zip].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/listings"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Home className="h-7 w-7 text-primary shrink-0" />
            <span className="min-w-0">{listing.address}</span>
          </h1>
          <p className="text-sm sm:text-base text-white/50 mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            {location || "Location unavailable"}
            {listing.county ? ` · ${listing.county} County` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full border ${
              listing.isActive
                ? "border-green-500/30 text-green-400 bg-green-500/10"
                : "border-white/20 text-white/50 bg-white/5"
            }`}
          >
            {listing.isActive ? "Active" : "Inactive"}
          </span>
          {listing.isNew ? (
            <span className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary bg-primary/10">
              New
            </span>
          ) : null}
          {listing.detailUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={listing.detailUrl} target="_blank" rel="noopener noreferrer">
                Open source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-base">Property overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Fact label="Price" value={<span className="text-xl font-bold">{listing.priceLabel}</span>} />
              <Fact
                label="Beds"
                value={
                  listing.bedrooms != null
                    ? formatAdminListingsCount(listing.bedrooms)
                    : "—"
                }
              />
              <Fact
                label="Baths"
                value={
                  listing.bathrooms != null ? String(listing.bathrooms) : "—"
                }
              />
              <Fact
                label="Sq ft"
                value={
                  listing.squareFootage != null
                    ? formatAdminListingsCount(listing.squareFootage)
                    : "—"
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fact label="Property type" value={listing.propertyType} />
              <Fact label="Status" value={listing.status} />
              <Fact label="Year built" value={listing.yearBuilt} />
              <Fact
                label="Lot size"
                value={
                  listing.lotSize != null
                    ? formatAdminListingsCount(listing.lotSize)
                    : "—"
                }
              />
              <Fact label="Category" value={listing.categoryLabel} />
              <Fact label="Source agency" value={listing.sourceAgency} />
            </div>
            {listing.tags.length > 0 ? (
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.imageUrl}
                alt={listing.address}
                className="w-full rounded-xl border border-white/10 object-cover max-h-72"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-white/40">
                No image on file
              </div>
            )}
            <p className="text-xs text-white/40 mt-2">
              {listing.hasImage ? "Image URL present" : "Missing image"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Identity & source
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Fact label="Listing ID" value={<span className="font-mono text-xs">{listing.id}</span>} />
            <Fact
              label="External ID"
              value={
                listing.externalId ? (
                  <span className="font-mono text-xs">{listing.externalId}</span>
                ) : (
                  "—"
                )
              }
            />
            <Fact label="Source" value={listing.sourceName} />
            <Fact label="Source ID" value={listing.sourceId} />
            <Fact
              label="Source feed URL"
              value={
                listing.sourceUrl ? (
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {listing.sourceUrl}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Fact
              label="Coordinates"
              value={
                listing.lat != null && listing.lng != null
                  ? `${listing.lat}, ${listing.lng}`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base">Pipeline timestamps</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Fact label="Scraped" value={formatAdminListingsDate(listing.scrapedAt)} />
            <Fact label="Created" value={formatAdminListingsDate(listing.createdAt)} />
            <Fact label="Updated" value={formatAdminListingsDate(listing.updatedAt)} />
            <Fact
              label="Source last scraped"
              value={formatAdminListingsDate(listing.sourceLastScrapedAt)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base">Raw metadata</CardTitle>
        </CardHeader>
        <CardContent>
          {listing.metadata && Object.keys(listing.metadata).length > 0 ? (
            <pre className="text-xs text-white/70 overflow-x-auto rounded-xl bg-black/30 border border-white/10 p-4 max-h-[420px]">
              {JSON.stringify(listing.metadata, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-white/45">No metadata payload on this listing.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
