"use client";

import { useEffect } from "react";
import {
  applyLockedBlur,
  clearLockedBlur,
  readListingUnlocked,
  writeListingUnlocked,
} from "@/lib/property-gate";
import { recordRecentlyViewed } from "@/lib/recently-viewed";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

type PropertyUnlockGateProps = {
  enabled: boolean;
};

/** Sensitive listing fields — paywall hides price, address, specs, gallery & contact */
const BLUR_SELECTORS = [
  ".section-property-image",
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

function unlockAll(root: HTMLElement) {
  root.querySelectorAll(".proty-blurred").forEach((el) => {
    clearLockedBlur(el as HTMLElement);
  });

  root.querySelectorAll(".proty-unlock-gate").forEach((gate) => {
    const btns = gate.querySelector(".proty-unlock-btns");
    const note = gate.querySelector(".proty-unlocked-note");
    if (btns) (btns as HTMLElement).style.display = "none";
    if (note) (note as HTMLElement).style.display = "flex";
  });
}

function buildPaywallHtml(variant: "inline" | "sidebar"): string {
  const subtitle =
    variant === "inline"
      ? "Exact price, full address, specs, amenities &amp; seller contact"
      : "Unlock seller phone, email &amp; full listing data";

  return `
    <div class="proty-unlock-gate proty-unlock-${variant}">
      <div class="proty-unlock-head">
        <div class="proty-unlock-icon">🔐</div>
        <h4>Unlock full property details</h4>
        <p>${subtitle}</p>
      </div>
      <div class="proty-unlock-body">
        <div class="proty-unlock-btns">
          <button type="button" class="proty-btn-unlock tf-btn bg-color-primary w-full" data-proty-unlock>
            Unlock this property — $4.99
          </button>
          <button type="button" class="proty-btn-sub tf-btn style-border w-full" data-proty-unlock>
            Subscribe — $49/mo · unlimited
          </button>
        </div>
        <div class="proty-unlocked-note">✓ Unlocked — full listing details now visible</div>
        <p class="proty-unlock-secure">🔒 Secure checkout · powered by Stripe</p>
      </div>
    </div>
  `;
}

function attachUnlockHandlers(root: HTMLElement, gate: HTMLElement, scope: string) {
  gate.querySelectorAll("[data-proty-unlock]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      writeListingUnlocked(scope);
      unlockAll(root);
    });
  });
}

function insertPaywall(
  root: HTMLElement,
  parent: HTMLElement,
  variant: "inline" | "sidebar",
  scope: string,
  before?: Element | null,
) {
  if (parent.querySelector(`.proty-unlock-${variant}`)) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildPaywallHtml(variant);
  const gate = wrapper.firstElementChild as HTMLElement;

  if (before) {
    parent.insertBefore(gate, before);
  } else {
    parent.appendChild(gate);
  }

  attachUnlockHandlers(root, gate, scope);
}

function initGate(root: HTMLElement, scope: string) {
  const alreadyUnlocked = readListingUnlocked(scope);

  BLUR_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((el) => {
      if (alreadyUnlocked) {
        clearLockedBlur(el as HTMLElement);
      } else {
        applyLockedBlur(el as HTMLElement);
      }
    });
  });

  const propertyDetailSection = root.querySelector(".section-property-detail");
  const mainContent = root.querySelector(".main-content") ?? root;

  if (propertyDetailSection && mainContent) {
    insertPaywall(
      root,
      mainContent as HTMLElement,
      "inline",
      scope,
      propertyDetailSection,
    );
  } else {
    const overview = root.querySelector(".wg-property.box-overview") as HTMLElement | null;
    if (overview) {
      const insertBefore =
        overview.nextElementSibling?.classList.contains("proty-unlock-inline")
          ? overview.nextElementSibling.nextElementSibling
          : overview.nextElementSibling;
      insertPaywall(root, overview.parentElement ?? overview, "inline", scope, insertBefore);
    }
  }

  const sidebar = root.querySelector(".section-property-detail .tf-sidebar") as HTMLElement | null;

  if (sidebar) {
    insertPaywall(root, sidebar, "sidebar", scope, sidebar.firstElementChild);
  }

  if (alreadyUnlocked) {
    unlockAll(root);
  }
}

export function PropertyUnlockGate({ enabled }: PropertyUnlockGateProps) {
  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      const root = document.getElementById("template-root");
      if (!root) return;
      initGate(root, window.location.pathname);
    };

    run();
    const t = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 800);
    const t3 = window.setTimeout(run, 2000);
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
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(recordTimer);
    };
  }, [enabled]);

  return null;
}
