"use client";

import type { User } from "@supabase/supabase-js";
import {
  REOVANA_ACCOUNT_HTML,
  REOVANA_LOGIN_HTML,
  fixReovanaHeader,
} from "@/lib/fix-reovana-header";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";

const AUTH_MESSAGE_CLASS = "reovana-auth-message";

function applyAuthHeader(user: User | null) {
  const scopes = [
    document.getElementById("template-root"),
    document.getElementById("template-chrome-root"),
  ].filter(Boolean) as HTMLElement[];

  if (!scopes.length) {
    document.querySelectorAll(".reovana-header-auth").forEach((node) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = (user ? REOVANA_ACCOUNT_HTML : REOVANA_LOGIN_HTML).trim();
      const next = wrap.firstElementChild;
      if (next) node.replaceWith(next);
    });
    return;
  }

  scopes.forEach((scope) => {
    fixReovanaHeader(scope);
    scope.querySelectorAll(".reovana-header-auth").forEach((node) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = (user ? REOVANA_ACCOUNT_HTML : REOVANA_LOGIN_HTML).trim();
      const next = wrap.firstElementChild;
      if (next) node.replaceWith(next);
    });
  });
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

    closeModal("modalLogin");
    window.location.href = "/dashboard";
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    submitLink.classList.remove("disabled");

    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }

    if (data.session) {
      closeModal("modalRegister");
      window.location.href = "/dashboard";
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

function wireOAuthButtons(supabase: ReturnType<typeof tryCreateSupabaseBrowserClient>) {
  if (!supabase) return;

  const startOAuth = async (modal: HTMLElement, provider: "google" | "facebook") => {
    clearAuthMessage(modal);

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      showAuthMessage(modal, error.message);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  const wireModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.querySelectorAll<HTMLAnchorElement>(".group-btn .btn-social, .group-btn a.btn-social").forEach((link) => {
      if (link.getAttribute("data-reovana-auth-wired") === "oauth") return;

      const label = link.textContent?.trim().toLowerCase() ?? "";
      const provider = label.includes("google")
        ? "google"
        : label.includes("facebook")
          ? "facebook"
          : null;
      if (!provider) return;

      link.setAttribute("data-reovana-auth-wired", "oauth");
      link.setAttribute("href", "#");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void startOAuth(modal, provider);
      });
    });
  };

  wireModal("modalLogin");
  wireModal("modalRegister");
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
  window.history.replaceState({}, "", clean.toString());
}

function wireLogoutLinks() {
  document.querySelectorAll('a[href*="logout"], a[href*="Logout"]').forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) return;
    if (node.getAttribute("data-reovana-auth-wired") === "logout") return;
    node.setAttribute("data-reovana-auth-wired", "logout");
    node.addEventListener("click", (event) => {
      event.preventDefault();
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/auth/signout";
      document.body.appendChild(form);
      form.submit();
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
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/auth/signout";
      document.body.appendChild(form);
      form.submit();
    });
  });
}

export function wireTemplateAuth() {
  const supabase = tryCreateSupabaseBrowserClient();
  if (!supabase) return () => {};

  wireLoginForm(supabase);
  wireRegisterForm(supabase);
  wireOAuthButtons(supabase);
  wireLogoutLinks();
  handleLoginQueryParam();

  void supabase.auth.getUser().then(({ data }) => {
    applyAuthHeader(data.user ?? null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    applyAuthHeader(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}
