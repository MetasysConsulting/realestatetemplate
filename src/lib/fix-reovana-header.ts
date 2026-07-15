export const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="/search" class="reovana-header-search-link">Search</a><a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a></div>`;

const REOVANA_USER_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15.749 6C15.749 6.99456 15.3539 7.94839 14.6507 8.65165C13.9474 9.35491 12.9936 9.75 11.999 9.75C11.0044 9.75 10.0506 9.35491 9.34735 8.65165C8.64409 7.94839 8.249 6.99456 8.249 6C8.249 5.00544 8.64409 4.05161 9.34735 3.34835C10.0506 2.64509 11.0044 2.25 11.999 2.25C12.9936 2.25 13.9474 2.64509 14.6507 3.34835C15.3539 4.05161 15.749 5.00544 15.749 6ZM4.5 20.118C4.53213 18.1504 5.33634 16.2742 6.73918 14.894C8.14202 13.5139 10.0311 12.7405 11.999 12.7405C13.9669 12.7405 15.856 13.5139 17.2588 14.894C18.6617 16.2742 19.4659 18.1504 19.498 20.118C17.1454 21.1968 14.5871 21.7535 11.999 21.75C9.323 21.75 6.783 21.166 4.5 20.118Z" stroke="#2C2E33" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const REOVANA_PROFILE_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 15C16.3807 15 17.5 13.8807 17.5 12.5C17.5 11.1193 16.3807 10 15 10C13.6193 10 12.5 11.1193 12.5 12.5C12.5 13.8807 13.6193 15 15 15Z" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5013 9.16667C9.34225 9.16667 10.8346 7.67428 10.8346 5.83333C10.8346 3.99238 9.34225 2.5 7.5013 2.5C5.66035 2.5 4.16797 3.99238 4.16797 5.83333C4.16797 7.67428 5.66035 9.16667 7.5013 9.16667Z" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.33464 12.5H5.0013C4.11725 12.5 3.2694 12.8512 2.64428 13.4763C2.01916 14.1014 1.66797 14.9493 1.66797 15.8333V17.5" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const REOVANA_LOGOUT_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.332 14.1667L17.4987 10L13.332 5.83337" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 10H7.5" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const REOVANA_BILLING_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.5 6.667h15M2.5 8.333h15M4.167 13.333h3.333M4.167 3.333h11.666c.92 0 1.667.746 1.667 1.667v10c0 .92-.746 1.667-1.667 1.667H4.167c-.92 0-1.667-.746-1.667-1.667v-10c0-.92.746-1.667 1.667-1.667Z" stroke="#A8ABAE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const REOVANA_ACCOUNT_HTML = `<div class="reovana-header-auth"><a href="/search" class="reovana-header-search-link">Search</a><div class="box-user reovana-account-menu" role="button" tabindex="0" aria-label="Account menu" aria-haspopup="true" aria-expanded="false"><div class="user">${REOVANA_USER_ICON_SVG}</div><div class="menu-user"><a class="dropdown-item" href="/dashboard">Dashboard</a><a class="dropdown-item" href="/search">Map search</a><a class="dropdown-item" href="/my-profile">${REOVANA_PROFILE_ICON_SVG}Account settings</a><a class="dropdown-item" href="/billing">${REOVANA_BILLING_ICON_SVG}Billing</a><a class="dropdown-item" href="#">${REOVANA_LOGOUT_ICON_SVG}Logout</a></div></div></div>`;

export const REOVANA_LOGO = "/images/reovana/logo.png";
export const REOVANA_LOGO_DARK = "/images/reovana/logo-dark.jpeg";

/** Keep chrome headers visible — template .header-sticky is hidden until scroll. */
export function prepareChromeHeader(headerHtml: string): string {
  if (!headerHtml) return headerHtml;

  return headerHtml.replace(
    /<header([^>]*?)class="([^"]*?)"/i,
    (_match, before, classes) => {
      const parts = new Set(classes.split(/\s+/).filter(Boolean));
      parts.add("header-sticky");
      parts.add("reovana-nav-static");
      parts.add("is-sticky");
      return `<header${before}class="${[...parts].join(" ")}"`;
    },
  );
}

/** Same header DOM fixes on every page (home template + auctions chrome). */
export function fixReovanaHeader(root: ParentNode) {
  const container =
    root instanceof HTMLElement
      ? root
      : root instanceof Document
        ? root.body
        : null;

  if (!container) return;

  const scope =
    container.id === "template-root" || container.id === "template-chrome-root"
      ? container
      : container.querySelector("#template-root, #template-chrome-root");

  if (!scope) return;

  /* Only dedupe the site nav header — not content <header> blocks on Learn pages. */
  const chromeSlot = scope.querySelector(".template-chrome-header");
  if (chromeSlot) {
    const chromeHeaders = chromeSlot.querySelectorAll(":scope > header");
    if (chromeHeaders.length > 1) {
      chromeHeaders[0].remove();
    }
  } else {
    const wrapper = scope.querySelector("#wrapper");
    const navHeaders = wrapper
      ? wrapper.querySelectorAll("header.header-sticky, header#header-main")
      : scope.querySelectorAll("header.header-sticky, header#header-main");
    if (navHeaders.length > 1) {
      navHeaders[0].remove();
    }
  }

  scope.querySelectorAll(".box-user").forEach((box) => {
    // Logged-in account control also uses .box-user — never reset it to Login.
    if (box.classList.contains("reovana-account-menu")) return;
    if (box.closest(".reovana-header-auth")) return;

    const wrap = document.createElement("div");
    wrap.innerHTML = REOVANA_LOGIN_HTML.trim();
    const auth = wrap.firstElementChild;
    if (auth) box.replaceWith(auth);
  });

  scope.querySelectorAll(".header-inner-wrap").forEach((wrap) => {
    const headerRight = wrap.querySelector(":scope > .header-right");
    if (!headerRight || headerRight.children.length > 0) return;

    const actions = wrap.querySelector(":scope > .reovana-header-actions");
    const mobile = wrap.querySelector(":scope > .mobile-button");
    if (actions) headerRight.appendChild(actions);
    if (mobile && !headerRight.contains(mobile)) {
      headerRight.appendChild(mobile);
    }
  });

  scope.querySelectorAll(".header-right").forEach((headerRight) => {
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

  scope.querySelectorAll("#logo_footer").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.src = REOVANA_LOGO;
    img.classList.add("reovana-logo", "reovana-footer-logo");
    img.alt = "REOVANA";
  });

  scope.querySelectorAll("#logo_header, .header-logo img.logo_header, .header-logo img.reovana-logo").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.classList.add("reovana-logo", "logo_header");
    img.removeAttribute("width");
    img.removeAttribute("height");
    if (!img.getAttribute("src")?.includes("/images/reovana/")) {
      img.src = REOVANA_LOGO;
    }
    img.setAttribute("data-light", REOVANA_LOGO);
    img.setAttribute("data-dark", REOVANA_LOGO_DARK);
  });

  /* Template .header-sticky defaults to off-screen until scroll; keep nav visible. */
  scope
    .querySelectorAll("header#header-main, header.header.header-sticky")
    .forEach((header) => {
      header.classList.add("reovana-nav-static", "is-sticky");
    });
}
