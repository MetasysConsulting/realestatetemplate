"use client";

import { useEffect } from "react";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";

type TemplateChromeProps = {
  headerHtml: string;
  footerHtml: string;
  tailHtml: string;
  bodyClass?: string;
  children: React.ReactNode;
};

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

function fixChromeDom() {
  const root = document.getElementById("template-chrome-root");
  if (!root) return;

  const headers = root.querySelectorAll("header");
  if (headers.length > 1) headers[0].remove();

  root.querySelectorAll("header").forEach((header) => {
    header.classList.add("is-sticky", "reovana-chrome-header");
  });

  root.querySelectorAll(".box-user").forEach((box) => {
    const auth = document.createElement("div");
    auth.className = "reovana-header-auth";
    auth.innerHTML = `<a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a>`;
    box.replaceWith(auth);
  });

  root.querySelectorAll(".header-inner-wrap").forEach((wrap) => {
    const headerRight = wrap.querySelector(":scope > .header-right");
    if (!headerRight || headerRight.children.length > 0) return;
    const actions = wrap.querySelector(":scope > .reovana-header-actions");
    const mobile = wrap.querySelector(":scope > .mobile-button");
    if (actions) headerRight.appendChild(actions);
    if (mobile && !headerRight.contains(mobile)) headerRight.appendChild(mobile);
  });

  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
  document.body.classList.remove("popup-loader");
}

export function TemplateChrome({
  headerHtml,
  footerHtml,
  tailHtml,
  bodyClass = "theme-color-4",
  children,
}: TemplateChromeProps) {
  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);
    fixChromeDom();
  }, [bodyClass, headerHtml, footerHtml, tailHtml]);

  return (
    <div id="template-chrome-root">
      {headerHtml ? (
        <div
          className="template-chrome-header"
          dangerouslySetInnerHTML={{ __html: headerHtml }}
        />
      ) : null}
      {children}
      {footerHtml ? (
        <div
          className="template-chrome-footer"
          dangerouslySetInnerHTML={{ __html: footerHtml }}
        />
      ) : null}
      {tailHtml ? (
        <div
          className="template-chrome-tail"
          dangerouslySetInnerHTML={{ __html: tailHtml }}
        />
      ) : null}
    </div>
  );
}

export function getIndexChrome(html: string) {
  return extractTemplateChrome(html);
}
