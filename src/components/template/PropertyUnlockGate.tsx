"use client";

import { useEffect } from "react";
import { UNLOCK_STORAGE_KEY } from "@/lib/property-gate";

type PropertyUnlockGateProps = {
  enabled: boolean;
};

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
  el.classList.add("proty-blurred");
  el.style.filter = "blur(6px)";
  el.style.userSelect = "none";
  el.style.pointerEvents = "none";
}

function buildPaywallHtml(): string {
  return `
    <div class="proty-unlock-gate">
      <div class="proty-unlock-head">
        <div class="proty-unlock-icon">🔐</div>
        <h4>Unlock full property details</h4>
        <p>Exact address, seller contact &amp; location data</p>
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
        <div class="proty-unlocked-note">✓ Unlocked — full details now visible</div>
        <p class="proty-unlock-secure">🔒 Secure checkout · powered by Stripe</p>
      </div>
    </div>
  `;
}

function initGate(root: HTMLElement) {
  if (root.dataset.protyGateInit === "true") return;
  root.dataset.protyGateInit = "true";

  const alreadyUnlocked =
    typeof window !== "undefined" &&
    sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "1";

  const location = root.querySelector(
    ".section-property-detail .box-overview .location",
  ) as HTMLElement | null;
  if (location) applyBlur(location);

  const sellerInfo = root.querySelector(
    ".section-property-detail .form-contact-seller .seller-info",
  ) as HTMLElement | null;
  if (sellerInfo) applyBlur(sellerInfo);

  const mapBlock = root.querySelector(
    ".section-property-detail .single-property-map",
  ) as HTMLElement | null;
  if (mapBlock) {
    const infoMap = mapBlock.querySelector(".info-map") as HTMLElement | null;
    if (infoMap) applyBlur(infoMap);
    const iframe = mapBlock.querySelector("iframe") as HTMLElement | null;
    if (iframe) applyBlur(iframe);
  }

  const sidebar = root.querySelector(
    ".section-property-detail .tf-sidebar",
  ) as HTMLElement | null;

  if (sidebar && !sidebar.querySelector(".proty-unlock-gate")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildPaywallHtml();
    const gate = wrapper.firstElementChild as HTMLElement;
    sidebar.insertBefore(gate, sidebar.firstChild);

    gate.querySelectorAll("[data-proty-unlock]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        unlockAll(root);
      });
    });
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
    const t2 = window.setTimeout(run, 600);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [enabled]);

  return null;
}
