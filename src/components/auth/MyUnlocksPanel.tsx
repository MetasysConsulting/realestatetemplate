import Link from "next/link";
import {
  listMyListingUnlocks,
  type MyListingUnlockRow,
} from "@/lib/unlocks/entitlements";
import { getAuthUser } from "@/lib/supabase/auth-server";

function sourceLabel(source: string): string {
  switch (source) {
    case "stripe_one_time":
      return "One-time unlock";
    case "stripe_subscription":
      return "Unlimited plan";
    case "admin_grant":
      return "Admin grant";
    case "promo":
      return "Promo unlock";
    default:
      return source.replace(/_/g, " ");
  }
}

function formatUnlockedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function locationLine(row: MyListingUnlockRow): string | null {
  const parts = [row.city, row.state].filter(Boolean);
  if (row.zip) parts.push(row.zip);
  return parts.length ? parts.join(", ") : null;
}

function UnlockThumb({ row }: { row: MyListingUnlockRow }) {
  if (row.imageUrl) {
    return (
      // Listing CDN URLs vary by source; avoid next/image remote config issues.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={row.imageUrl}
        alt=""
        className="reovana-my-unlocks__thumb-img"
        loading="lazy"
      />
    );
  }

  return (
    <div className="reovana-my-unlocks__thumb-fallback" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-5.5h-3V21H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function UnlockRow({ row }: { row: MyListingUnlockRow }) {
  const location = locationLine(row);
  const unlockedOn = formatUnlockedDate(row.unlockedAt);

  return (
    <li>
      <Link href={row.detailPath} className="reovana-my-unlocks__row">
        <div className="reovana-my-unlocks__thumb">
          <UnlockThumb row={row} />
        </div>
        <div className="reovana-my-unlocks__body">
          <div className="reovana-my-unlocks__topline">
            {row.categoryLabel ? (
              <span className="reovana-my-unlocks__badge">{row.categoryLabel}</span>
            ) : null}
            <span className="reovana-my-unlocks__source">{sourceLabel(row.source)}</span>
          </div>
          <h3 className="reovana-my-unlocks__address">{row.address || row.label}</h3>
          {location ? <p className="reovana-my-unlocks__location">{location}</p> : null}
          <div className="reovana-my-unlocks__meta">
            {row.priceLabel ? (
              <span className="reovana-my-unlocks__price">{row.priceLabel}</span>
            ) : null}
            {unlockedOn ? (
              <span className="reovana-my-unlocks__date">Unlocked {unlockedOn}</span>
            ) : null}
          </div>
        </div>
        <span className="reovana-my-unlocks__cta">
          View listing
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M6 3.5 10.5 8 6 12.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </li>
  );
}

export async function MyUnlocksPanel() {
  const user = await getAuthUser();
  if (!user) {
    return (
      <div className="widget-box-2 reovana-account-settings reovana-my-unlocks">
        <div className="box">
          <h3 className="title">My unlocks</h3>
          <p className="body-1 reovana-account-settings__intro">
            Sign in to see listings you&apos;ve unlocked and open them anytime.
          </p>
          <a
            href="#modalLogin"
            className="tf-btn bg-color-primary pd-20"
            data-bs-toggle="modal"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const unlocks = await listMyListingUnlocks();

  return (
    <div id="my-unlocks" className="widget-box-2 reovana-account-settings reovana-my-unlocks">
      <div className="box">
        <div className="reovana-my-unlocks__header">
          <div>
            <h3 className="title">My unlocks</h3>
            <p className="body-1 reovana-account-settings__intro">
              {unlocks.length === 0
                ? "No unlocked listings yet. Unlock a property on any listing page and it will show up here."
                : "Open any unlocked listing below — full details stay available on this account."}
            </p>
          </div>
          {unlocks.length > 0 ? (
            <p className="reovana-my-unlocks__count">
              {unlocks.length} {unlocks.length === 1 ? "listing" : "listings"}
            </p>
          ) : null}
        </div>

        {unlocks.length === 0 ? (
          <Link href="/buy/foreclosure" className="tf-btn style-border pd-20">
            Browse foreclosures
          </Link>
        ) : (
          <ul className="reovana-my-unlocks__list">
            {unlocks.map((row) => (
              <UnlockRow key={`${row.listingId}-${row.unlockedAt}`} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
