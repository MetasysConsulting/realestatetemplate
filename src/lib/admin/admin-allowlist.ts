/** Server-side admin allowlist. Security checks must use this — never trust the client. */

export const DEFAULT_ADMIN_EMAILS = [
  "creditteck1@gmail.com",
  "metasysprojects@gmail.com",
] as const;

export function getAdminAllowlist(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS?.trim();
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS.map((email) => email.toLowerCase());
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminAllowlist().includes(email.trim().toLowerCase());
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}
