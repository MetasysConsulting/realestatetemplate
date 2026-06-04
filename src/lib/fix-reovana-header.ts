export const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a></div>`;

export const REOVANA_LOGO = "/images/reovana/logo.png";

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

  const headers = scope.querySelectorAll("header");
  if (headers.length > 1) {
    headers[0].remove();
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
}
