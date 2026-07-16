"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  geocodeAddress,
  PropertyMapPinPicker,
} from "@/components/sell/PropertyMapPinPicker";
import {
  SELLER_LISTING_STATUSES,
  SELLER_PROPERTY_TYPES,
} from "@/lib/seller/property-types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

const MAX_IMAGES = 8;

export function AddPropertyForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const remaining = MAX_IMAGES - imageUrls.length;
      const batch = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const file of batch) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/seller/upload", {
          method: "POST",
          credentials: "same-origin",
          body,
        });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (res.status === 401) {
          router.push("/?login=required&next=/add-property");
          return;
        }
        if (!res.ok || !data.url) {
          setError(data.error ?? "Image upload failed.");
          continue;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length) {
        setImageUrls((current) => [...current, ...uploaded].slice(0, MAX_IMAGES));
      }
    } finally {
      setUploading(false);
    }
  };

  const pinFromAddress = async (form: HTMLFormElement) => {
    const address = String(new FormData(form).get("address") ?? "");
    const city = String(new FormData(form).get("city") ?? "");
    const state = String(new FormData(form).get("state") ?? "");
    const zip = String(new FormData(form).get("zip") ?? "");
    const query = [address, city, state, zip].filter(Boolean).join(", ");
    setGeocoding(true);
    setError(null);
    try {
      const hit = await geocodeAddress(query);
      if (!hit) {
        setError("Could not find that address on the map. Click the map to place a pin.");
        return;
      }
      setLat(hit.lat);
      setLng(hit.lng);
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || uploading) return;
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      zip: String(form.get("zip") ?? ""),
      county: String(form.get("county") ?? ""),
      price: String(form.get("price") ?? ""),
      bedrooms: String(form.get("bedrooms") ?? ""),
      bathrooms: String(form.get("bathrooms") ?? ""),
      squareFootage: String(form.get("squareFootage") ?? ""),
      lotSize: String(form.get("lotSize") ?? ""),
      yearBuilt: String(form.get("yearBuilt") ?? ""),
      garage: String(form.get("garage") ?? ""),
      propertyType: String(form.get("propertyType") ?? ""),
      listingStatus: String(form.get("listingStatus") ?? ""),
      description: String(form.get("description") ?? ""),
      videoUrl: String(form.get("videoUrl") ?? ""),
      virtualTourUrl: String(form.get("virtualTourUrl") ?? ""),
      lat,
      lng,
      imageUrls,
    };

    try {
      const saveRes = await fetch("/api/seller/properties", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveData = (await saveRes.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        published?: boolean;
        status?: string;
      };

      if (saveRes.status === 401) {
        router.push("/?login=required&next=/add-property");
        return;
      }
      if (!saveRes.ok || !saveData.id) {
        setError(saveData.error ?? "Could not save your listing.");
        return;
      }

      // Already has $49 sub → listing is active + public; no checkout needed.
      if (saveData.published || saveData.status === "active") {
        router.push("/my-property?published=1");
        router.refresh();
        return;
      }

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "seller_listing",
          propertyId: saveData.id,
          returnPath: "/my-property",
        }),
      });
      const checkoutData = (await checkoutRes.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (checkoutRes.ok && checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }

      router.push(
        `/my-property?draft=${encodeURIComponent(saveData.id)}${
          checkoutData.error ? `&checkout_error=${encodeURIComponent(checkoutData.error)}` : ""
        }`,
      );
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="reovana-add-property" onSubmit={(e) => void onSubmit(e)}>
      <p className="reovana-add-property__intro">
        Fill in as much as you can — photos and a map pin help buyers take you seriously — then
        continue to the <strong>$49/month</strong> listing subscription to publish.
      </p>

      <h2 className="reovana-add-property__section">Basics</h2>
      <div className="reovana-add-property__grid">
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Listing title</span>
          <input name="title" type="text" placeholder="e.g. 3/2 Tampa fixer — investor ready" />
        </label>
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Street address</span>
          <input name="address" type="text" required autoComplete="street-address" />
        </label>
        <label className="reovana-add-property__field">
          <span>City</span>
          <input name="city" type="text" required autoComplete="address-level2" />
        </label>
        <label className="reovana-add-property__field">
          <span>State</span>
          <select name="state" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {US_STATES.map((abbr) => (
              <option key={abbr} value={abbr}>
                {abbr}
              </option>
            ))}
          </select>
        </label>
        <label className="reovana-add-property__field">
          <span>ZIP</span>
          <input name="zip" type="text" required autoComplete="postal-code" />
        </label>
        <label className="reovana-add-property__field">
          <span>County</span>
          <input name="county" type="text" />
        </label>
        <label className="reovana-add-property__field">
          <span>Property type</span>
          <select name="propertyType" defaultValue="">
            <option value="">Select</option>
            {SELLER_PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="reovana-add-property__field">
          <span>Listing status</span>
          <select name="listingStatus" defaultValue="For Sale">
            {SELLER_LISTING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="reovana-add-property__section">Specs & pricing</h2>
      <div className="reovana-add-property__grid">
        <label className="reovana-add-property__field">
          <span>Asking price (USD)</span>
          <input name="price" type="number" min="0" step="1" />
        </label>
        <label className="reovana-add-property__field">
          <span>Year built</span>
          <input name="yearBuilt" type="number" min="1800" max="2100" step="1" />
        </label>
        <label className="reovana-add-property__field">
          <span>Beds</span>
          <input name="bedrooms" type="number" min="0" step="1" />
        </label>
        <label className="reovana-add-property__field">
          <span>Baths</span>
          <input name="bathrooms" type="number" min="0" step="0.5" />
        </label>
        <label className="reovana-add-property__field">
          <span>Square feet</span>
          <input name="squareFootage" type="number" min="0" step="1" />
        </label>
        <label className="reovana-add-property__field">
          <span>Lot size (sqft)</span>
          <input name="lotSize" type="number" min="0" step="1" />
        </label>
        <label className="reovana-add-property__field">
          <span>Garage spaces</span>
          <input name="garage" type="number" min="0" step="1" />
        </label>
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Description</span>
          <textarea name="description" rows={5} placeholder="Condition, timeline, highlights…" />
        </label>
      </div>

      <h2 className="reovana-add-property__section">Photos</h2>
      <div className="reovana-add-property__media">
        <label className="reovana-add-property__upload">
          <span>{uploading ? "Uploading…" : `Upload photos (up to ${MAX_IMAGES})`}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || imageUrls.length >= MAX_IMAGES}
            onChange={(event) => {
              void uploadFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {imageUrls.length > 0 ? (
          <ul className="reovana-add-property__thumbs">
            {imageUrls.map((url) => (
              <li key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
                <button
                  type="button"
                  onClick={() => setImageUrls((current) => current.filter((u) => u !== url))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reovana-add-property__media-hint">JPEG, PNG, or WebP · max 5MB each</p>
        )}
      </div>

      <h2 className="reovana-add-property__section">Map pin</h2>
      <div className="reovana-add-property__map-actions">
        <button
          type="button"
          className="tf-btn style-border pd-20"
          disabled={geocoding}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void pinFromAddress(form);
          }}
        >
          {geocoding ? "Finding…" : "Place pin from address"}
        </button>
      </div>
      <PropertyMapPinPicker
        lat={lat}
        lng={lng}
        onChange={({ lat: nextLat, lng: nextLng }) => {
          setLat(nextLat);
          setLng(nextLng);
        }}
      />

      <h2 className="reovana-add-property__section">Media links</h2>
      <div className="reovana-add-property__grid">
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Video URL (YouTube / Vimeo)</span>
          <input name="videoUrl" type="url" placeholder="https://" />
        </label>
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Virtual tour URL</span>
          <input name="virtualTourUrl" type="url" placeholder="https://" />
        </label>
      </div>

      {error ? <p className="reovana-add-property__error">{error}</p> : null}

      <button
        type="submit"
        className="tf-btn bg-color-primary pd-20"
        disabled={pending || uploading}
      >
        {pending ? "Saving…" : "Continue to $49/mo checkout"}
      </button>
    </form>
  );
}
