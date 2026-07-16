"use client";

/**
 * Intercepts the Proty contact template form (#contactform)
 * and posts to /api/contact (Brevo).
 */

const WIRED = "data-reovana-contact-wired";
const MSG_CLASS = "reovana-contact-message";

function showMessage(form: HTMLFormElement, message: string, isError: boolean) {
  let box = form.querySelector(`.${MSG_CLASS}`) as HTMLElement | null;
  if (!box) {
    box = document.createElement("p");
    box.className = `${MSG_CLASS} text-1`;
    box.style.margin = "12px 0 0";
    const wrap = form.querySelector(".send-wrap");
    wrap?.before(box);
  }
  box.textContent = message;
  box.style.color = isError ? "#c0392b" : "var(--Primary, #7695ff)";
}

function readInterest(form: HTMLFormElement): string {
  const select = form.querySelector<HTMLSelectElement>("select[name='interest']");
  if (select?.value) return select.value.trim();

  const current = form.querySelector(".nice-select .current");
  const text = current?.textContent?.trim() ?? "";
  if (!text || /^select$/i.test(text)) return "";
  return text;
}

export function wireContactForm(): void {
  const form = document.getElementById("contactform") as HTMLFormElement | null;
  if (!form || form.getAttribute(WIRED) === "1") return;

  form.setAttribute(WIRED, "1");
  form.setAttribute("action", "/api/contact");
  form.setAttribute("method", "post");

  // Honeypot
  if (!form.querySelector("input[name='companyWebsite']")) {
    const honey = document.createElement("input");
    honey.type = "text";
    honey.name = "companyWebsite";
    honey.tabIndex = -1;
    honey.autocomplete = "off";
    honey.setAttribute("aria-hidden", "true");
    honey.style.cssText = "position:absolute;left:-9999px;height:0;overflow:hidden;";
    form.appendChild(honey);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = (form.querySelector<HTMLInputElement>("[name='name']")?.value ?? "").trim();
    const email = (form.querySelector<HTMLInputElement>("[name='email']")?.value ?? "").trim();
    const phone = (form.querySelector<HTMLInputElement>("[name='phone']")?.value ?? "").trim();
    const message = (form.querySelector<HTMLTextAreaElement>("[name='message']")?.value ?? "").trim();
    const companyWebsite = (
      form.querySelector<HTMLInputElement>("[name='companyWebsite']")?.value ?? ""
    ).trim();
    const interest = readInterest(form);

    const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const prevLabel = submitBtn?.textContent ?? "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          interest,
          message,
          companyWebsite,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        showMessage(form, data.error ?? "Could not send. Please try again.", true);
        return;
      }
      showMessage(form, "Thanks — your message was sent. We’ll get back to you soon.", false);
      form.reset();
    } catch {
      showMessage(form, "Network error. Please try again.", true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel || "Contact our experts";
      }
    }
  });
}
