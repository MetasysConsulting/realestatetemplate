"use client";

type ListingUnlockPaywallProps = {
  unlocked: boolean;
  variant?: "inline" | "sidebar";
  onUnlock: () => void;
};

export function ListingUnlockPaywall({
  unlocked,
  variant = "inline",
  onUnlock,
}: ListingUnlockPaywallProps) {
  const subtitle =
    variant === "inline"
      ? "Exact price, full address, specs, amenities & seller contact"
      : "Unlock seller phone, email & full listing data";

  if (unlocked) {
    return null;
  }

  return (
    <div className={`proty-unlock-gate proty-unlock-${variant}${variant === "sidebar" ? " mb-30" : ""}`}>
      <div className="proty-unlock-head">
        <div className="proty-unlock-icon">🔐</div>
        <h4>Unlock full property details</h4>
        <p>{subtitle}</p>
      </div>
      <div className="proty-unlock-body">
        <div className="proty-unlock-btns">
          <button type="button" className="proty-btn-unlock tf-btn bg-color-primary w-full" onClick={onUnlock}>
            Unlock this property — $4.99
          </button>
          <button type="button" className="proty-btn-sub tf-btn style-border w-full" onClick={onUnlock}>
            Subscribe — $49/mo · unlimited
          </button>
        </div>
        <p className="proty-unlock-secure">🔒 Secure checkout · powered by Stripe</p>
      </div>
    </div>
  );
}
