"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { HOME_TOP_NEW_LISTINGS } from "@/lib/admin/reovana-admin-data";
import { BedDouble, Bath, Ruler, MapPin, Eye } from "lucide-react";

const ListingDetail = () => {
  const params = useParams();
  const id = decodeURIComponent((params.id as string) ?? "");
  const listing = HOME_TOP_NEW_LISTINGS.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button variant="outline" className="border-primary/30" asChild>
          <Link href="/admin/home">← Back to Home</Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-white">Listing not found: {id}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="outline" className="border-primary/30" asChild>
        <Link href="/admin/home">← Back to Home</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">{listing.address}</CardTitle>
          <p className="text-sm text-white/50 font-mono">{listing.id}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-white/50">Price</p>
              <p className="text-xl font-bold text-primary">{listing.price}</p>
            </div>
            <div>
              <p className="text-white/50">Type</p>
              <p className="text-white">{listing.category}</p>
            </div>
            <div>
              <p className="text-white/50">Added</p>
              <p className="text-white">{listing.added}</p>
            </div>
            <div>
              <p className="text-white/50">Status</p>
              <p className="text-green-400">Published</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-primary" /> {listing.beds} beds
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-primary" /> {listing.baths} baths
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-primary" /> {listing.sqft} sqft
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> {listing.views} views
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs uppercase text-white/50 mb-1">Address</p>
            <p className="text-white flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {listing.address}
            </p>
            <p className="text-xs text-white/40 mt-2">Source: {listing.source}</p>
          </div>

          <Button asChild>
            <Link href="/admin/listings">Open in listings table</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingDetail;
