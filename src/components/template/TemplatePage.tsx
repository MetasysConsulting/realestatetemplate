"use client";

import { useEffect } from "react";
import { PropertyUnlockGate } from "@/components/template/PropertyUnlockGate";

type TemplatePageProps = {
  html: string;
  bodyClass: string;
  propertyGate?: boolean;
};

const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a></div>`;

const REOVANA_LOGO = "/images/reovana/logo.png";

function groupHeaderActionsInDom(root: HTMLElement) {
  root.querySelectorAll(".header-right").forEach((headerRight) => {
    const auth = headerRight.querySelector(".reovana-header-auth");
    const btnAdd = headerRight.querySelector(".btn-add");
    if (!auth || !btnAdd || headerRight.querySelector(".reovana-header-actions")) {
      return;
    }
    const actions = document.createElement("div");
    actions.className = "reovana-header-actions";
    auth.before(actions);
    actions.append(auth, btnAdd);
  });
}

function fixFooterLogo(root: HTMLElement) {
  root.querySelectorAll("#logo_footer").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.src = REOVANA_LOGO;
    img.classList.add("reovana-logo", "reovana-footer-logo");
    img.alt = "REOVANA";
  });
}

function repairHeaderRightInDom(root: HTMLElement) {
  root.querySelectorAll(".header-inner-wrap").forEach((wrap) => {
    const headerRight = wrap.querySelector(":scope > .header-right");
    if (!headerRight || headerRight.children.length > 0) return;

    const actions = wrap.querySelector(":scope > .reovana-header-actions");
    const mobile = wrap.querySelector(":scope > .mobile-button");
    if (actions) headerRight.appendChild(actions);
    if (mobile && !headerRight.contains(mobile)) {
      headerRight.appendChild(mobile);
    }
  });
}

function fixTemplateHeader() {
  const root = document.getElementById("template-root");
  if (!root) return;

  const headers = root.querySelectorAll("header");
  if (headers.length > 1) {
    headers[0].remove();
  }

  repairHeaderRightInDom(root);

  root.querySelectorAll(".box-user").forEach((box) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = REOVANA_LOGIN_HTML.trim();
    const auth = wrap.firstElementChild;
    if (auth) box.replaceWith(auth);
  });

  groupHeaderActionsInDom(root);
  fixFooterLogo(root);
}

function normalizeBodyClass(bodyClass: string): string {
  const classes = bodyClass
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !/^theme-color-[123]$/.test(c));

  if (!classes.includes("theme-color-4")) {
    classes.push("theme-color-4");
  }

  return classes.join(" ");
}

export function TemplatePage({
  html,
  bodyClass,
  propertyGate = false,
}: TemplatePageProps) {
  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);

    const hideLoader = () => {
      const loading = document.getElementById("loading");
      if (loading) {
        loading.style.display = "none";
      }
      document.body.classList.remove("popup-loader");
    };

    fixTemplateHeader();

    hideLoader();
    const t = window.setTimeout(hideLoader, 800);
    return () => window.clearTimeout(t);
  }, [bodyClass, html]);

  return (
    <>
      <PropertyUnlockGate enabled={propertyGate} />
      <div id="template-root" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
