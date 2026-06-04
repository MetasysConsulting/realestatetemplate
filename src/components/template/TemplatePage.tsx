"use client";

import { useEffect } from "react";
import { PropertyUnlockGate } from "@/components/template/PropertyUnlockGate";

type TemplatePageProps = {
  html: string;
  bodyClass: string;
  propertyGate?: boolean;
};

const REOVANA_LOGIN_ICON = `<svg class="reovana-login-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15.749 6C15.749 6.99456 15.3539 7.94839 14.6507 8.65165C13.9474 9.35491 12.9936 9.75 11.999 9.75C11.0044 9.75 10.0506 9.35491 9.34735 8.65165C8.64409 7.94839 8.249 6.99456 8.249 6C8.249 5.00544 8.64409 4.05161 9.34735 3.34835C10.0506 2.64509 11.0044 2.25 11.999 2.25C12.9936 2.25 13.9474 2.64509 14.6507 3.34835C15.3539 4.05161 15.749 5.00544 15.749 6ZM4.5 20.118C4.53213 18.1504 5.33634 16.2742 6.73918 14.894C8.14202 13.5139 10.0311 12.7405 11.999 12.7405C13.9669 12.7405 15.856 13.5139 17.2588 14.894C18.6617 16.2742 19.4659 18.1504 19.498 20.118C17.1454 21.1968 14.5871 21.7535 11.999 21.75C9.323 21.75 6.783 21.166 4.5 20.118Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="#modalLogin" class="reovana-login-btn" data-bs-toggle="modal" aria-label="Log in"><span class="reovana-login-btn__icon">${REOVANA_LOGIN_ICON}</span><span class="reovana-login-tooltip" role="tooltip">Log in</span></a></div>`;

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

function fixTemplateHeader() {
  const root = document.getElementById("template-root");
  if (!root) return;

  const headers = root.querySelectorAll("header");
  if (headers.length > 1) {
    headers[0].remove();
  }

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
