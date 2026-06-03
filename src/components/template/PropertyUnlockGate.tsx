"use client";

import { useEffect } from "react";
import { UNLOCK_STORAGE_KEY } from "@/lib/property-gate";

type PropertyUnlockGateProps = {
  enabled: boolean;
};

/** Sensitive listing fields — gallery, title & video stay visible for intrigue */
const BLUR_SELECTORS = [
  ".wg-property.box-overview .price",
  ".wg-property.box-overview .location",
  ".wg-property.box-overview .meta-list",
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
  ".section-property-detail .form-contact-agent",
  ".section-similar-properties .box-house .content",
];

function unlockAll(root: HTMLElement) {
  root.querySelectorAll(".proty-blurred").forEach((el) => {
    const node = el as HTMLElement;
    node.style.filter = "none";
    node.style.userSelect = "auto";
    node.style.pointerEvents = "auto";
    node.classList.remove("proty-blurred");
  });

  root.querySelectorAll(".proty-unlock-gate").forEach((gate) => {
    const btns = gate.querySelector(".proty-unlock-btns");
    const note = gate.querySelector(".proty-unlocked-note");
    if (btns) (btns as HTMLElement).style.display = "none";
    if (note) (note as HTMLElement).style.display = "flex";
  });

  if (typeof window !== "undefined") {
    sessionStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  }
}

function applyBlur(el: HTMLElement) {
  if (el.classList.contains("proty-blurred")) return;
  el.classList.add("proty-blurred");
  el.style.filter = "blur(7px)";
  el.style.userSelect = "none";
  el.style.pointerEvents = "none";
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

function attachUnlockHandlers(root: HTMLElement, gate: HTMLElement) {
  gate.querySelectorAll("[data-proty-unlock]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      unlockAll(root);
    });
  });
}

function insertPaywall(
  root: HTMLElement,
  parent: HTMLElement,
  variant: "inline" | "sidebar",
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

  attachUnlockHandlers(root, gate);
}

function initGate(root: HTMLElement) {
  if (root.dataset.protyGateInit === "true") return;
  root.dataset.protyGateInit = "true";

  const alreadyUnlocked =
    typeof window !== "undefined" &&
    sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "1";

  BLUR_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((el) => {
      applyBlur(el as HTMLElement);
    });
  });

  const overview = root.querySelector(
    ".wg-property.box-overview",
  ) as HTMLElement | null;

  if (overview) {
    const insertBefore =
      overview.nextElementSibling?.classList.contains("proty-unlock-inline")
        ? overview.nextElementSibling.nextElementSibling
        : overview.nextElementSibling;
    insertPaywall(root, overview.parentElement ?? overview, "inline", insertBefore);
  }

  const sidebar = root.querySelector(
    ".section-property-detail .tf-sidebar",
  ) as HTMLElement | null;

  if (sidebar) {
    insertPaywall(root, sidebar, "sidebar", sidebar.firstElementChild);
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
      if (root) initGate(root);
    };

    run();
    const t = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 800);
    const t3 = window.setTimeout(run, 2000);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [enabled]);

  return null;
}
