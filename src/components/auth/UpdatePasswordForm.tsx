"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!supabase) {
        setError("Auth is not configured.");
        setReady(true);
        return;
      }
      const { data, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userError || !data.user) {
        setError(
          "Your reset link is invalid or expired. Request a new one from the login form.",
        );
        setReady(true);
        return;
      }
      setReady(true);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError("Auth is not configured.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || "Could not update password.");
        return;
      }
      setSuccess("Password updated. Redirecting to your account…");
      window.setTimeout(() => {
        router.push("/my-profile");
        router.refresh();
      }, 900);
    } catch {
      setError("Could not update password. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="widget-box-2 reovana-account-settings">
      <div className="box">
        <h3 className="title">New password</h3>
        <p className="body-1 reovana-account-settings__intro">
          Choose a new password for your REOVANA account. After saving, you can sign in with it
          anytime.
        </p>

        {!ready ? (
          <p className="body-1 reovana-account-settings__status">Checking your reset session…</p>
        ) : (
          <form
            className="reovana-account-settings__form"
            onSubmit={(e) => void onSubmit(e)}
          >
            <fieldset className="box box-fieldset">
              <label htmlFor="newPassword">
                New password<span>*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </fieldset>

            <fieldset className="box box-fieldset">
              <label htmlFor="confirmPassword">
                Confirm password<span>*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </fieldset>

            {error ? (
              <p className="reovana-account-settings__message reovana-account-settings__message--error">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="reovana-account-settings__message reovana-account-settings__message--success">
                {success}
              </p>
            ) : null}

            <div className="box reovana-account-settings__actions">
              <button
                type="submit"
                className="tf-btn bg-color-primary pd-20"
                disabled={pending}
              >
                {pending ? "Saving…" : "Update password"}
              </button>
              <Link href="/?login=required" className="tf-btn style-border pd-20">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
