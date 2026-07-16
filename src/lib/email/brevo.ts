/**
 * Brevo transactional email helper.
 * Requires BREVO_API_KEY + BREVO_SENDER_EMAIL (verified in Brevo).
 */

export type BrevoSendInput = {
  toEmail: string;
  toName?: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
  replyToEmail?: string;
  replyToName?: string;
};

export function getBrevoConfig(): {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  notifyEmail: string;
} | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) return null;

  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "REOVANA";
  const notifyEmail =
    process.env.BREVO_NOTIFY_EMAIL?.trim() ||
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    senderEmail;

  return { apiKey, senderEmail, senderName, notifyEmail };
}

export function isBrevoConfigured(): boolean {
  return Boolean(getBrevoConfig());
}

export async function sendBrevoEmail(
  input: BrevoSendInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getBrevoConfig();
  if (!config) {
    return {
      ok: false,
      error: "Email is not configured yet (missing BREVO_API_KEY or BREVO_SENDER_EMAIL).",
    };
  }

  const payload = {
    sender: {
      email: config.senderEmail,
      name: config.senderName,
    },
    to: [
      {
        email: input.toEmail,
        name: input.toName || undefined,
      },
    ],
    subject: input.subject,
    textContent: input.textContent,
    htmlContent: input.htmlContent || undefined,
    replyTo: input.replyToEmail
      ? {
          email: input.replyToEmail,
          name: input.replyToName || undefined,
        }
      : undefined,
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[brevo] send failed", res.status, body.slice(0, 500));
      return { ok: false, error: "Could not send email. Try again later." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[brevo] send error", error);
    return { ok: false, error: "Could not send email. Try again later." };
  }
}
