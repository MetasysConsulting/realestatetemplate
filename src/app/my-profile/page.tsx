"use client";

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

export default function MyProfilePage() {
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
      const name = splitName(profile?.full_name ?? (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ?? (user.user_metadata as { name?: string } | null)?.name);

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
    setMessage("Saved.");
  };

  const onLogout = async () => {
    setMessage(null);
    setError(null);
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="tf-container xl" style={{ paddingTop: 32, paddingBottom: 56 }}>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="widget-box-2">
            <div className="box">
              <h3 className="title">Account settings</h3>

              {loading ? (
                <p className="body-1" style={{ marginTop: 12 }}>
                  Loading…
                </p>
              ) : (
                <>
                  <div className="box grid-layout-2 gap-30" style={{ marginTop: 16 }}>
                    <fieldset className="box-fieldset">
                      <label htmlFor="firstName">First name</label>
                      <input
                        id="firstName"
                        type="text"
                        className="form-control"
                        value={state.firstName}
                        onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))}
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
                      />
                    </fieldset>
                  </div>

                  <fieldset className="box box-fieldset" style={{ marginTop: 16 }}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" className="form-control" value={state.email} disabled />
                  </fieldset>

                  {error ? (
                    <p className="caption-2" style={{ marginTop: 12, color: "#c0392b" }}>
                      {error}
                    </p>
                  ) : null}
                  {message ? (
                    <p className="caption-2" style={{ marginTop: 12, color: "var(--Primary, #7695ff)" }}>
                      {message}
                    </p>
                  ) : null}

                  <div className="box" style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button
                      type="button"
                      className="tf-btn bg-color-primary pd-10"
                      onClick={onSave}
                      disabled={saving || loading}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className="tf-btn style-border pd-10" onClick={onLogout} disabled={saving}>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

