"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

export function AddPropertyForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      zip: String(form.get("zip") ?? ""),
      price: String(form.get("price") ?? ""),
      bedrooms: String(form.get("bedrooms") ?? ""),
      bathrooms: String(form.get("bathrooms") ?? ""),
      squareFootage: String(form.get("squareFootage") ?? ""),
      description: String(form.get("description") ?? ""),
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
      };

      if (saveRes.status === 401) {
        router.push("/?login=required&next=/add-property");
        return;
      }
      if (!saveRes.ok || !saveData.id) {
        setError(saveData.error ?? "Could not save your listing.");
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

      // Draft saved but checkout unavailable — still land on My Properties.
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
        Enter your property details, then continue to the{" "}
        <strong>$49/month</strong> listing subscription to publish on REOVANA.
      </p>

      <div className="reovana-add-property__grid">
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
          <span>Asking price (USD)</span>
          <input name="price" type="number" min="0" step="1" />
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
        <label className="reovana-add-property__field reovana-add-property__field--full">
          <span>Description</span>
          <textarea name="description" rows={5} placeholder="Condition, timeline, highlights…" />
        </label>
      </div>

      {error ? <p className="reovana-add-property__error">{error}</p> : null}

      <button type="submit" className="tf-btn bg-color-primary pd-20" disabled={pending}>
        {pending ? "Saving…" : "Continue to $49/mo checkout"}
      </button>
    </form>
  );
}
