"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";

type FormState = {
  firstName: string;
  lastName: string;
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

export function AccountSettingsForm() {
  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({ firstName: "", lastName: "", email: "" });

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
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const metadata = user.user_metadata as { full_name?: string; name?: string } | null;
      const name = splitName(profile?.full_name ?? metadata?.full_name ?? metadata?.name);

      setState({
        firstName: name.firstName,
        lastName: name.lastName,
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

    setSaving(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setSaving(false);
      setError("You are not logged in.");
      return;
    }

    const fullName = joinName(state.firstName, state.lastName);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userData.user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Your account settings were saved.");
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
          Update the name shown on your REOVANA account.
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
                />
              </fieldset>

              <fieldset className="box-fieldset">
                <label htmlFor="lastName">
                  Last name<span>*</span>
                </label>
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
