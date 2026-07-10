"use client";

import { useEffect } from "react";
import {
  applyLockedBlur,
  clearGalleryBlur,
  clearLockedBlur,
  fetchPaywallAccess,
  listingIdFromPropertyDetailPath,
  trackUnlockIntent,
} from "@/lib/property-gate";
import { recordRecentlyViewed } from "@/lib/recently-viewed";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

type PropertyUnlockGateProps = {
  enabled: boolean;
};

/** Sensitive listing fields — paywall hides price, address, specs & contact (photos stay visible). */
const BLUR_SELECTORS = [
  ".flat-title .breadcrumb li:last-child",
  ".wg-property.box-overview .title",
  ".wg-property.box-overview .price",
  ".wg-property.box-overview .location",
  ".wg-property.box-overview .meta-list",
  ".wg-property.box-overview .action",
  ".wg-property.box-overview .info-detail",
  ".wg-property.box-property-detail",
  ".wg-property.box-amenities",
  ".wg-property.single-property-map",
  ".wg-property.single-property-floor",
  ".wg-property.box-attachments",
  ".wg-property.box-virtual-tour",
  ".wg-property.box-loan",
  ".wg-property.single-property-nearby",
  ".wg-property.box-comment",
  ".section-property-detail .form-contact-seller",
  ".section-property-detail .sidebar-ads",
  ".section-property-detail .form-contact-agent",
  ".section-similar-properties .box-house .content",
];

const CHECKOUT_SOON_MESSAGE =
  "Paid unlocks are almost ready. Checkout isn’t live yet — we’ll enable one-tap unlock here soon.";

const LOCKED_PLACEHOLDER = "Unlock to view";

function unlockAll(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-proty-original-html]").forEach((el) => {
    const original = el.getAttribute("data-proty-original-html");
    if (original != null) {
      el.innerHTML = original;
      el.removeAttribute("data-proty-original-html");
    }
  });

  root.querySelectorAll(".proty-blurred").forEach((el) => {
    clearLockedBlur(el as HTMLElement);
  });

  root.querySelectorAll(".proty-unlock-gate, .reovana-unlock-card").forEach((gate) => {
    (gate as HTMLElement).style.display = "none";
  });
}

function redactElement(el: HTMLElement) {
  if (el.getAttribute("data-proty-original-html") != null) return;
  el.setAttribute("data-proty-original-html", el.innerHTML);
  el.innerHTML = `<span class="proty-locked-placeholder">${LOCKED_PLACEHOLDER}</span>`;
}

function buildPaywallHtml(): string {
  return `
    <aside class="reovana-unlock-card proty-unlock-gate proty-unlock-sidebar mb-30" aria-label="Unlock property details">
      <div class="reovana-unlock-card__head">
        <span class="reovana-unlock-card__badge">Members only</span>
        <h4 class="reovana-unlock-card__title">Unlock this listing</h4>
        <p class="reovana-unlock-card__subtitle">
          Reveal the full address, pricing, specs, and seller contact in one step.
        </p>
      </div>
      <div class="reovana-unlock-card__body">
        <ul class="reovana-unlock-card__perks">
          <li><span class="reovana-unlock-card__check">✓</span>Exact list price</li>
          <li><span class="reovana-unlock-card__check">✓</span>Full street address</li>
          <li><span class="reovana-unlock-card__check">✓</span>Beds, baths &amp; square footage</li>
          <li><span class="reovana-unlock-card__check">✓</span>Amenities and property facts</li>
          <li><span class="reovana-unlock-card__check">✓</span>Seller phone &amp; email</li>
        </ul>
        <div class="reovana-unlock-card__actions proty-unlock-btns">
          <button type="button" class="reovana-unlock-card__primary" data-proty-unlock>
            <span class="reovana-unlock-card__price-row"><span>Unlock this property</span><strong>$4.99</strong></span>
          </button>
          <button type="button" class="reovana-unlock-card__secondary" data-proty-unlock>
            <span class="reovana-unlock-card__price-row"><span>Unlimited access</span><strong>$49/mo</strong></span>
          </button>
        </div>
        <p class="reovana-unlock-card__notice" data-proty-unlock-notice hidden role="status"></p>
      </div>
    </aside>
  `;
}

function attachUnlockHandlers(gate: HTMLElement, scope: string) {
  gate.querySelectorAll("[data-proty-unlock]").forEach((btn) => {
    if (btn.getAttribute("data-proty-unlock-wired") === "1") return;
    btn.setAttribute("data-proty-unlock-wired", "1");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      trackUnlockIntent(scope, "checkout_soon");
      const notice = gate.querySelector<HTMLElement>("[data-proty-unlock-notice]");
      if (notice) {
        notice.hidden = false;
        notice.textContent = CHECKOUT_SOON_MESSAGE;
      }
    });
  });
}

function insertSidebarPaywall(root: HTMLElement, sidebar: HTMLElement, scope: string) {
  if (sidebar.querySelector(".proty-unlock-sidebar, .reovana-unlock-card")) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildPaywallHtml();
  const gate = wrapper.firstElementChild as HTMLElement;
  sidebar.insertBefore(gate, sidebar.firstElementChild);
  attachUnlockHandlers(gate, scope);
}

function initGate(root: HTMLElement, scope: string, unlocked: boolean) {
  clearGalleryBlur(root);

  BLUR_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((node) => {
      const el = node as HTMLElement;
      if (unlocked) {
        clearLockedBlur(el);
      } else {
        redactElement(el);
        applyLockedBlur(el);
      }
    });
  });

  if (unlocked) {
    unlockAll(root);
    return;
  }

  const sidebar = root.querySelector(".section-property-detail .tf-sidebar") as HTMLElement | null;
  if (sidebar) {
    insertSidebarPaywall(root, sidebar, scope);
  }
}

export function PropertyUnlockGate({ enabled }: PropertyUnlockGateProps) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const run = async () => {
      const root = document.getElementById("template-root");
      if (!root || cancelled) return;

      const scope = window.location.pathname;
      const listingId = listingIdFromPropertyDetailPath(scope);
      const access = await fetchPaywallAccess(listingId);
      if (cancelled) return;

      initGate(root, listingId || scope, access.unlocked);
    };

    void run();
    const t = window.setTimeout(() => void run(), 100);
    const t2 = window.setTimeout(() => void run(), 800);
    const t3 = window.setTimeout(() => void run(), 2000);
    const recordTimer = window.setTimeout(() => {
      const root = document.getElementById("template-root");
      if (!root) return;

      const location =
        root.querySelector(".wg-property.box-overview .location")?.textContent?.trim() ||
        root.querySelector(".wg-property .title")?.textContent?.trim() ||
        "Property listing";
      const priceText =
        root.querySelector(".wg-property.box-overview .price")?.textContent?.trim() || "$0";
      const price = Number(priceText.replace(/[^0-9.]/g, "")) || 0;
      const imageUrl =
        root.querySelector<HTMLImageElement>(".section-property-image img")?.src ||
        DEFAULT_AUCTION_PROPERTY_IMAGE;
      const parts = location.split(",").map((part) => part.trim());
      const address = parts[0] || location;
      const city = parts[1] || "";
      const stateZip = parts[2]?.split(/\s+/) ?? [];
      const state = stateZip[0] || "";
      const zip = stateZip[1] || "";

      recordRecentlyViewed({
        id: window.location.pathname,
        address,
        city,
        state,
        zip,
        price,
        priceLabel: "Listing Price",
        imageUrl,
        detailPath: window.location.pathname,
      });
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(recordTimer);
    };
  }, [enabled]);

  return null;
}
