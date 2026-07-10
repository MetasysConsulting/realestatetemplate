import { listMyListingUnlocks } from "@/lib/unlocks/entitlements";
import { getAuthUser } from "@/lib/supabase/auth-server";

export async function MyUnlocksPanel() {
  const user = await getAuthUser();
  if (!user) {
    return (
      <div className="reovana-account-settings mt-30">
        <h2 className="title">My unlocks</h2>
        <p className="reovana-account-settings__intro">
          Sign in to see listings you&apos;ve unlocked. Paid unlocks will appear here once checkout is live.
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
          No unlocked listings yet. When Stripe checkout goes live, purchases will be saved to your
          account and show up here.
        </p>
      ) : (
        <ul className="reovana-account-settings__intro" style={{ listStyle: "disc", paddingLeft: 20 }}>
          {unlocks.map((row) => (
            <li key={`${row.listingId}-${row.unlockedAt}`}>
              <code>{row.listingId}</code>
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
