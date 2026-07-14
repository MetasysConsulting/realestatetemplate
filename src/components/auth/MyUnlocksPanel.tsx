import Link from "next/link";
import { listMyListingUnlocks } from "@/lib/unlocks/entitlements";
import { getAuthUser } from "@/lib/supabase/auth-server";

export async function MyUnlocksPanel() {
  const user = await getAuthUser();
  if (!user) {
    return (
      <div className="reovana-account-settings mt-30">
        <h2 className="title">My unlocks</h2>
        <p className="reovana-account-settings__intro">
          Sign in to see listings you&apos;ve unlocked.
        </p>
      </div>
    );
  }

  const unlocks = await listMyListingUnlocks();

  return (
    <div className="reovana-account-settings mt-30">
      <h2 className="title">My unlocks</h2>
      {unlocks.length === 0 ? (
        <p className="reovana-account-settings__intro">
          No unlocked listings yet. Unlock a property on any listing page and it will show up here.
        </p>
      ) : (
        <ul className="reovana-account-settings__intro" style={{ listStyle: "disc", paddingLeft: 20 }}>
          {unlocks.map((row) => (
            <li key={`${row.listingId}-${row.unlockedAt}`}>
              <Link href={row.detailPath}>{row.label}</Link>
              <span>
                {" "}
                · {row.source.replace(/_/g, " ")} ·{" "}
                {new Date(row.unlockedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
