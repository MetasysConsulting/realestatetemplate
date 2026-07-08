export const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a></div>`;

export const REOVANA_ACCOUNT_HTML = `
<div class="reovana-header-auth dropdown">
  <a
    href="#"
    class="tf-btn bg-color-primary pd-23 reovana-login-btn reovana-account-btn dropdown-toggle"
    role="button"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    <span class="reovana-account-icon" aria-hidden="true">👤</span>
    <span class="reovana-account-label">Account</span>
  </a>
  <ul class="dropdown-menu dropdown-menu-end reovana-account-menu">
    <li><a class="dropdown-item" href="/my-profile">Account settings</a></li>
    <li><hr class="dropdown-divider" /></li>
    <li><a class="dropdown-item" href="/logout">Logout</a></li>
  </ul>
</div>
`.trim();

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
