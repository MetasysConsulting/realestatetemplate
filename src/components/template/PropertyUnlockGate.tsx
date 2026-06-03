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

  root.querySelectorAll(".proty-unlock-gate, .proty-unlock-overlay").forEach((gate) => {
    const btns = gate.querySelector(".proty-unlock-btns");
    const note = gate.querySelector(".proty-unlocked-note");
    if (btns) (btns as HTMLElement).style.display = "none";
    if (note) (note as HTMLElement).style.display = "flex";
    if (gate.classList.contains("proty-unlock-overlay")) {
      window.setTimeout(() => gate.remove(), 400);
    }
  });

  if (typeof window !== "undefined") {
    sessionStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  }
}

function applyBlur(el: HTMLElement) {
  el.classList.add("proty-blurred");
  el.style.filter = "blur(8px)";
  el.style.userSelect = "none";
  el.style.pointerEvents = "none";
}

function buildPaywallHtml(): string {
  return `
    <div class="proty-unlock-gate">
      <div class="proty-unlock-head">
        <div class="proty-unlock-icon">🔐</div>
        <h4>Unlock full property details</h4>
        <p>Specs, description, amenities, map, floor plans &amp; seller contact</p>
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

function insertPaywall(root: HTMLElement, parent: HTMLElement, className: string) {
  if (parent.querySelector(`.${className}`)) return null;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildPaywallHtml();
  const gate = wrapper.firstElementChild as HTMLElement;
  gate.classList.add(className);
  parent.appendChild(gate);
  attachUnlockHandlers(root, gate);
  return gate;
}

function initGate(root: HTMLElement) {
  if (root.dataset.protyGateInit === "true") return;
  root.dataset.protyGateInit = "true";

  const alreadyUnlocked =
    typeof window !== "undefined" &&
    sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "1";

  const blurTargets = [
    ".section-property-image",
    ".section-property-detail .col-xl-8",
    ".section-property-detail .col-lg-7",
    ".section-similar-properties",
  ];

  blurTargets.forEach((selector) => {
    root.querySelectorAll(selector).forEach((el) => {
      applyBlur(el as HTMLElement);
    });
  });

  const mainCol = (root.querySelector(
    ".section-property-detail .col-xl-8, .section-property-detail .col-lg-7",
  ) ?? null) as HTMLElement | null;

  if (mainCol) {
    mainCol.style.position = "relative";
    insertPaywall(root, mainCol, "proty-unlock-overlay");
  }

  const sidebar = root.querySelector(
    ".section-property-detail .tf-sidebar",
  ) as HTMLElement | null;

  if (sidebar) {
    Array.from(sidebar.children).forEach((child) => {
      if (!(child as HTMLElement).classList.contains("proty-unlock-gate")) {
        applyBlur(child as HTMLElement);
      }
    });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildPaywallHtml();
    const gate = wrapper.firstElementChild as HTMLElement;
    if (!sidebar.querySelector(".proty-unlock-gate")) {
      sidebar.insertBefore(gate, sidebar.firstChild);
      attachUnlockHandlers(root, gate);
    }
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
