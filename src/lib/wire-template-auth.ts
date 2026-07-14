"use client";

import type { User } from "@supabase/supabase-js";
import {
  REOVANA_ACCOUNT_HTML,
  REOVANA_LOGIN_HTML,
  fixReovanaHeader,
} from "@/lib/fix-reovana-header";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackClientEvent } from "@/lib/analytics/client-track";

const AUTH_MESSAGE_CLASS = "reovana-auth-message";

function applyAuthHeader(user: User | null) {
  const scopes = [
    document.getElementById("template-root"),
    document.getElementById("template-chrome-root"),
  ].filter(Boolean) as HTMLElement[];

  const html = (user ? REOVANA_ACCOUNT_HTML : REOVANA_LOGIN_HTML).trim();

  const replaceAuthNodes = (nodes: NodeListOf<Element> | Element[]) => {
    nodes.forEach((node) => {
      const wantsAccount = Boolean(user);
      const hasAccount = Boolean(node.querySelector(".reovana-account-menu"));
      const hasLogin = Boolean(node.querySelector(".reovana-login-btn"));
      if (wantsAccount && hasAccount) return;
      if (!wantsAccount && hasLogin) return;

      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      const next = wrap.firstElementChild;
      if (next) node.replaceWith(next);
    });
  };

  if (!scopes.length) {
    replaceAuthNodes(document.querySelectorAll(".reovana-header-auth"));
    if (user) wireAccountMenus();
    wireLogoutLinks();
    return;
  }

  scopes.forEach((scope) => {
    fixReovanaHeader(scope);
    replaceAuthNodes(scope.querySelectorAll(".reovana-header-auth"));
  });

  if (user) wireAccountMenus();
  wireLogoutLinks();
}

function showAuthMessage(modal: HTMLElement, message: string, isError = true) {
  let box = modal.querySelector(`.${AUTH_MESSAGE_CLASS}`) as HTMLElement | null;
  if (!box) {
    box = document.createElement("p");
    box.className = `${AUTH_MESSAGE_CLASS} box text-center caption-2`;
    const titleBox = modal.querySelector(".title-box");
    titleBox?.after(box);
  }
  box.textContent = message;
  box.style.color = isError ? "#c0392b" : "var(--Primary, #7695ff)";
}

function clearAuthMessage(modal: HTMLElement) {
  modal.querySelector(`.${AUTH_MESSAGE_CLASS}`)?.remove();
}

function getBootstrapModal(id: string): { show: () => void; hide: () => void } | null {
  const el = document.getElementById(id);
  if (!el) return null;

  type BootstrapModal = { getInstance?: (el: Element) => { show: () => void; hide: () => void } | null; new (el: Element): { show: () => void; hide: () => void } };
  const Modal = (window as Window & { bootstrap?: { Modal: BootstrapModal } }).bootstrap?.Modal;
  if (!Modal) return null;

  return Modal.getInstance?.(el) ?? new Modal(el);
}

function openLoginModal() {
  getBootstrapModal("modalLogin")?.show();
}

function closeModal(id: string) {
  getBootstrapModal(id)?.hide();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function wireLoginForm(supabase: ReturnType<typeof tryCreateSupabaseBrowserClient>) {
  if (!supabase) return;

  const modal = document.getElementById("modalLogin");
  if (!modal) return;

  const form = modal.querySelector("form.form-account");
  const emailInput = modal.querySelector<HTMLInputElement>("#nameAccount");
  const passwordInput = modal.querySelector<HTMLInputElement>("#pass");
  const submitLink = modal.querySelector<HTMLAnchorElement>(".box-btn .tf-btn");
  const forgotLink = modal.querySelector<HTMLAnchorElement>(".text-forgot a");

  if (!form || !emailInput || !passwordInput || !submitLink) return;

  emailInput.type = "email";
  emailInput.autocomplete = "email";
  passwordInput.type = "password";
  passwordInput.autocomplete = "current-password";

  if (form.getAttribute("data-reovana-auth-wired") === "login") return;
  form.setAttribute("data-reovana-auth-wired", "login");

  const handleLogin = async (event: Event) => {
    event.preventDefault();
    clearAuthMessage(modal);

    const email = normalizeEmail(emailInput.value);
    const password = passwordInput.value;

    if (!email || !password) {
      showAuthMessage(modal, "Enter your email and password.");
      return;
    }

    submitLink.classList.add("disabled");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    submitLink.classList.remove("disabled");

    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }

    trackClientEvent("login_success", { metadata: { method: "password" } });
    closeModal("modalLogin");
    window.location.href = getPostLoginRedirect();
  };

  form.addEventListener("submit", handleLogin);
  submitLink.addEventListener("click", handleLogin);

  forgotLink?.addEventListener("click", async (event) => {
    event.preventDefault();
    clearAuthMessage(modal);

    const email = normalizeEmail(emailInput.value);
    if (!email) {
      showAuthMessage(modal, "Enter your email above, then click Forgot password.");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=/my-profile`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }
    showAuthMessage(modal, "Password reset email sent. Check your inbox.", false);
  });
}

function wireRegisterForm(supabase: ReturnType<typeof tryCreateSupabaseBrowserClient>) {
  if (!supabase) return;

  const modal = document.getElementById("modalRegister");
  if (!modal) return;

  const form = modal.querySelector("form.form-account");
  const nameInput = modal.querySelector<HTMLInputElement>("#username");
  const emailInput = modal.querySelector<HTMLInputElement>("#email");
  const passwordInput = modal.querySelector<HTMLInputElement>("#pass2");
  const confirmInput = modal.querySelector<HTMLInputElement>("#confirm");
  const submitLink = modal.querySelector<HTMLAnchorElement>(".box-btn .tf-btn");

  if (!form || !nameInput || !emailInput || !passwordInput || !confirmInput || !submitLink) return;

  emailInput.type = "email";
  emailInput.autocomplete = "email";
  passwordInput.autocomplete = "new-password";
  confirmInput.autocomplete = "new-password";

  if (form.getAttribute("data-reovana-auth-wired") === "register") return;
  form.setAttribute("data-reovana-auth-wired", "register");

  const handleRegister = async (event: Event) => {
    event.preventDefault();
    clearAuthMessage(modal);

    const email = normalizeEmail(emailInput.value);
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const fullName = nameInput.value.trim();

    if (!fullName || !email || !password) {
      showAuthMessage(modal, "Fill in all registration fields.");
      return;
    }

    if (password !== confirm) {
      showAuthMessage(modal, "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showAuthMessage(modal, "Password must be at least 6 characters.");
      return;
    }

    submitLink.classList.add("disabled");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    submitLink.classList.remove("disabled");

    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }

    trackClientEvent("signup_success", {
      metadata: { method: "password", hasSession: Boolean(data.session) },
    });

    if (data.session) {
      closeModal("modalRegister");
      window.location.href = "/";
      return;
    }

    showAuthMessage(
      modal,
      "Account created. Check your email to confirm, then sign in.",
      false,
    );
  };

  form.addEventListener("submit", handleRegister);
  submitLink.addEventListener("click", handleRegister);
}

function socialButtonLabel(link: HTMLElement): string {
  // Prefer visible text nodes so SVG path data cannot confuse provider detection.
  const fromTextNodes = Array.from(link.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (fromTextNodes) return fromTextNodes;
  return (link.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function wireOAuthButtons(supabase: ReturnType<typeof tryCreateSupabaseBrowserClient>) {
  const startGoogleOAuth = async (modal: HTMLElement) => {
    if (!supabase) {
      showAuthMessage(modal, "Sign-in isn’t configured right now. Try again later.");
      return;
    }

    clearAuthMessage(modal);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(getPostLoginRedirect())}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    showAuthMessage(modal, "Could not start Google sign-in. Try again.");
  };

  const wireModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const links = Array.from(
      new Set(
        Array.from(
          modal.querySelectorAll<HTMLAnchorElement>(".group-btn a.btn-social, .group-btn .btn-social"),
        ),
      ),
    );

    links.forEach((link, index) => {
      const label = socialButtonLabel(link);
      const labeledFacebook = /\bfacebook\b/.test(label);
      const labeledGoogle = /\bgoogle\b/.test(label);

      // Remove Facebook — Google is the only social provider.
      if (labeledFacebook || (!labeledGoogle && index === 1)) {
        link.remove();
        return;
      }

      // Wire Google (by label, or first social button).
      if (!labeledGoogle && index !== 0) return;

      const group = link.closest(".group-btn") as HTMLElement | null;
      group?.classList.add("reovana-oauth-google-only");
      link.classList.add("reovana-btn-google");
      link.style.width = "100%";
      link.style.maxWidth = "100%";
      link.style.flex = "1 1 100%";
      link.style.boxSizing = "border-box";
      if (group) {
        group.style.display = "flex";
        group.style.justifyContent = "center";
        group.style.width = "100%";
        group.style.gap = "0";
      }

      if (link.getAttribute("data-reovana-auth-wired") === "oauth-google") return;

      link.setAttribute("data-reovana-auth-wired", "oauth-google");
      link.setAttribute("href", "#");
      link.setAttribute("role", "button");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void startGoogleOAuth(modal);
      });
    });

    // Normalize any remaining single Google button after Facebook removal.
    modal.querySelectorAll(".group-btn").forEach((node) => {
      const group = node as HTMLElement;
      const socials = Array.from(group.querySelectorAll<HTMLAnchorElement>(".btn-social"));
      socials.forEach((link, index) => {
        if (index > 0 || /\bfacebook\b/.test(socialButtonLabel(link))) {
          link.remove();
        }
      });
      const google = group.querySelector<HTMLAnchorElement>(".btn-social");
      if (!google) return;
      group.classList.add("reovana-oauth-google-only");
      google.classList.add("reovana-btn-google");
      google.style.width = "100%";
      google.style.maxWidth = "100%";
      group.style.width = "100%";
      group.style.display = "flex";
    });
  };

  wireModal("modalLogin");
  wireModal("modalRegister");
}

function getPostLoginRedirect(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
  } catch {
    /* ignore */
  }
  return "/";
}

function handleLoginQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const login = params.get("login");
  if (!login) return;

  if (login === "required" || login === "error") {
    window.setTimeout(() => {
      openLoginModal();
      if (login === "error") {
        const modal = document.getElementById("modalLogin");
        if (modal) {
          showAuthMessage(modal, "Sign-in link expired or invalid. Try again.");
        }
      }
    }, 400);
  }

  const clean = new URL(window.location.href);
  clean.searchParams.delete("login");
  // Keep `next` so password login can redirect back to the unlocked listing.
  window.history.replaceState({}, "", clean.toString());
}

function setAccountMenuOpen(menu: HTMLElement, open: boolean) {
  menu.classList.toggle("active", open);
  menu.setAttribute("aria-expanded", open ? "true" : "false");
}

function wireAccountMenus() {
  // Capture-phase delegation so template main.js `.tf-action-btns` handlers
  // cannot double-toggle and cancel the open state (common on the homepage).
  const doc = document as Document & { __reovanaAccountMenuBound?: boolean };
  if (doc.__reovanaAccountMenuBound) return;
  doc.__reovanaAccountMenuBound = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const menuLink = target.closest<HTMLAnchorElement>(
        ".reovana-account-menu .menu-user a.dropdown-item",
      );
      if (menuLink) {
        document.querySelectorAll<HTMLElement>(".reovana-account-menu.active").forEach((menu) => {
          setAccountMenuOpen(menu, false);
        });
        return;
      }

      const menu = target.closest<HTMLElement>(".reovana-account-menu");
      if (menu) {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !menu.classList.contains("active");
        document.querySelectorAll<HTMLElement>(".reovana-account-menu.active").forEach((openMenu) => {
          if (openMenu !== menu) setAccountMenuOpen(openMenu, false);
        });
        setAccountMenuOpen(menu, willOpen);
        return;
      }

      document.querySelectorAll<HTMLElement>(".reovana-account-menu.active").forEach((openMenu) => {
        setAccountMenuOpen(openMenu, false);
      });
    },
    true,
  );

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const menu = target.closest<HTMLElement>(".reovana-account-menu");
    if (!menu) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setAccountMenuOpen(menu, !menu.classList.contains("active"));
    }
    if (event.key === "Escape") {
      setAccountMenuOpen(menu, false);
    }
  });
}

function submitSignOut() {
  trackClientEvent("logout");
  const form = document.createElement("form");
  form.method = "post";
  form.action = "/auth/signout";
  document.body.appendChild(form);
  form.submit();
}

function wireLogoutLinks() {
  document.querySelectorAll('a[href*="logout"], a[href*="Logout"]').forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) return;
    if (node.getAttribute("data-reovana-auth-wired") === "logout") return;
    node.setAttribute("data-reovana-auth-wired", "logout");
    node.addEventListener("click", (event) => {
      event.preventDefault();
      submitSignOut();
    });
  });

  document.querySelectorAll("a").forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) return;
    const text = node.textContent?.trim().toLowerCase();
    if (text !== "logout") return;
    if (node.getAttribute("data-reovana-auth-wired") === "logout") return;
    node.setAttribute("data-reovana-auth-wired", "logout");
    node.addEventListener("click", (event) => {
      event.preventDefault();
      submitSignOut();
    });
  });
}

export function wireTemplateAuth() {
  const supabase = tryCreateSupabaseBrowserClient();
  if (!supabase) return () => {};

  wireLoginForm(supabase);
  wireRegisterForm(supabase);
  wireOAuthButtons(supabase);
  wireAccountMenus();
  wireLogoutLinks();
  handleLoginQueryParam();

  let currentUser: User | null = null;

  const syncHeader = (user: User | null) => {
    currentUser = user;
    applyAuthHeader(user);
  };

  void supabase.auth.getUser().then(({ data }) => {
    syncHeader(data.user ?? null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    syncHeader(session?.user ?? null);
  });

  const onHeaderFixed = () => {
    applyAuthHeader(currentUser);
  };
  window.addEventListener("reovana:header-fixed", onHeaderFixed);

  return () => {
    subscription.unsubscribe();
    window.removeEventListener("reovana:header-fixed", onHeaderFixed);
  };
}
