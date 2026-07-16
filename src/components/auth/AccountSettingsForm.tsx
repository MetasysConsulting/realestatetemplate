"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

/** Normalize phone for storage; empty string clears the field. */
function normalizeProfilePhone(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

/**
 * Optional phone: empty is valid.
 * Non-empty must look like a phone (7–15 digits after stripping formatting).
 */
function validateProfilePhone(raw: string): string | null {
  const phone = normalizeProfilePhone(raw);
  if (!phone) return null;
  if (!/^[\d+\-().\s]+$/.test(phone)) {
    return "Use only digits and common phone characters (+ - ( ) .).";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Enter a valid phone number (7–15 digits).";
  }
  return null;
}

export function AccountSettingsForm() {
  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) {
        setLoading(false);
        setError("Auth is not configured.");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userError || !userData.user) {
        setLoading(false);
        setError("You are not logged in.");
        return;
      }

      const user = userData.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const metadata = user.user_metadata as {
        full_name?: string;
        name?: string;
        phone?: string;
      } | null;
      const name = splitName(profile?.full_name ?? metadata?.full_name ?? metadata?.name);
      const phone =
        (typeof profile?.phone === "string" && profile.phone.trim()) ||
        (typeof metadata?.phone === "string" && metadata.phone.trim()) ||
        "";

      setState({
        firstName: name.firstName,
        lastName: name.lastName,
        phone,
        email: user.email ?? "",
      });
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const onSave = async () => {
    setMessage(null);
    setError(null);
    if (!supabase) {
      setError("Auth is not configured.");
      return;
    }

    const fullName = joinName(state.firstName, state.lastName);
    if (!fullName) {
      setError("First name or last name is required.");
      return;
    }

    const phoneError = validateProfilePhone(state.phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    const phone = normalizeProfilePhone(state.phone);

    setSaving(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setSaving(false);
      setError("You are not logged in.");
      return;
    }

    const userId = userData.user.id;
    const now = new Date().toISOString();

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        name: fullName,
        phone: phone || null,
      },
    });
    if (authError) {
      setSaving(false);
      setError(authError.message || "Could not update account.");
      return;
    }

    const { data: saved, error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: userData.user.email ?? null,
          full_name: fullName,
          phone: phone || null,
          updated_at: now,
        },
        { onConflict: "id" },
      )
      .select("id, phone")
      .maybeSingle();

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!saved) {
      setError("Could not save your profile. Try again.");
      return;
    }

    setState((s) => ({ ...s, phone: saved.phone ? String(saved.phone) : phone }));
    setMessage(
      phone
        ? "Your account settings were saved."
        : "Your account settings were saved. Phone number cleared.",
    );
  };

  const onLogout = async () => {
    setMessage(null);
    setError(null);
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="widget-box-2 reovana-account-settings">
      <div className="box">
        <h3 className="title">Profile</h3>
        <p className="body-1 reovana-account-settings__intro">
          Update the name and phone number on your REOVANA account.
        </p>

        {loading ? (
          <p className="body-1 reovana-account-settings__status">Loading your account…</p>
        ) : (
          <form
            className="reovana-account-settings__form"
            onSubmit={(event) => {
              event.preventDefault();
              void onSave();
            }}
          >
            <div className="box grid-layout-2 gap-30">
              <fieldset className="box-fieldset">
                <label htmlFor="firstName">
                  First name<span>*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="form-control"
                  value={state.firstName}
                  onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </fieldset>

              <fieldset className="box-fieldset">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  className="form-control"
                  value={state.lastName}
                  onChange={(e) => setState((s) => ({ ...s, lastName: e.target.value }))}
                  placeholder="Last name"
                  autoComplete="family-name"
                />
              </fieldset>
            </div>

            <fieldset className="box box-fieldset">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                className="form-control"
                value={state.phone}
                onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
                placeholder="(305) 555-0123"
                autoComplete="tel"
                inputMode="tel"
                maxLength={40}
              />
              <p className="reovana-account-settings__hint">
                Optional. Used for loan follow-up and seller contact when you share it.
              </p>
            </fieldset>

            <fieldset className="box box-fieldset">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className="form-control" value={state.email} disabled />
            </fieldset>

            {error ? (
              <p className="reovana-account-settings__message reovana-account-settings__message--error">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="reovana-account-settings__message reovana-account-settings__message--success">
                {message}
              </p>
            ) : null}

            <div className="box reovana-account-settings__actions">
              <button
                type="submit"
                className="tf-btn bg-color-primary pd-20"
                disabled={saving || loading}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <Link href="/update-password" className="tf-btn style-border pd-20">
                Change password
              </Link>
              <button
                type="button"
                className="tf-btn style-border pd-20"
                onClick={onLogout}
                disabled={saving}
              >
                Logout
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
