"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import { ReovanaLogo } from "@/components/admin/reovana-logo";
import {
  adminSetRecoveryPasswordAction,
  type AdminAuthState,
} from "@/app/admin/actions";

export default function UpdatePassword() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction, isPending] = useActionState<AdminAuthState, FormData>(
    adminSetRecoveryPasswordAction,
    null,
  );

  return (
    <div className="admin-root relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(118, 149, 255, 0.22), transparent 55%), linear-gradient(165deg, #0f141f 0%, #161e2d 48%, #1a2233 100%)",
        }}
      />
      <div className="relative z-10 w-full max-w-[420px]">
        <Card className="border-white/10 bg-[#1c2433]/95 shadow-2xl shadow-black/30">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex justify-center pt-1">
              <ReovanaLogo size="lg" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                Choose a new password
              </CardTitle>
              <CardDescription className="text-[15px] text-white/55">
                Finish resetting your admin account password
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                >
                  {state.error}
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-white/80">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="h-11 border-white/10 bg-white/5 pr-10 text-white"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="h-11 border-white/10 bg-white/5 pr-10 text-white"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full bg-primary text-white hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Update password"}
              </Button>

              <p className="text-center text-sm text-white/50">
                <Link href="/admin/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
