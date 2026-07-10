"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Eye, EyeOff, Key, Save, Shield, User } from "lucide-react";
import {
  adminChangePasswordAction,
  adminUpdateProfileAction,
  type AdminAuthState,
} from "@/app/admin/actions";
import type { AdminSessionUser } from "@/lib/admin/require-admin";

type SettingsProps = {
  adminUser: AdminSessionUser & { phone?: string | null };
};

export default function Settings({ adminUser }: SettingsProps) {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileState, profileAction, profilePending] = useActionState<
    AdminAuthState,
    FormData
  >(adminUpdateProfileAction, null);

  const [passwordState, passwordAction, passwordPending] = useActionState<
    AdminAuthState,
    FormData
  >(adminChangePasswordAction, null);

  useEffect(() => {
    if (profileState?.success || passwordState?.success) {
      router.refresh();
    }
  }, [profileState?.success, passwordState?.success, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Site Settings</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Your admin profile and account security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-white mb-1">Admin Profile</CardTitle>
                <CardDescription>Signed-in operator account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={profileAction} className="space-y-4">
              {profileState?.error ? (
                <p className="text-sm text-red-300" role="alert">
                  {profileState.error}
                </p>
              ) : null}
              {profileState?.success ? (
                <p className="text-sm text-green-400" role="status">
                  {profileState.success}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={adminUser.fullName}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={adminUser.email}
                  disabled
                  className="opacity-70"
                />
                <p className="text-xs text-white/40">
                  Email is fixed to your allowlisted admin account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={adminUser.phone ?? ""}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                Role: {adminUser.role}
              </div>

              <Button
                type="submit"
                disabled={profilePending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                {profilePending ? "Saving…" : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-white mb-1">Change Password</CardTitle>
                <CardDescription>
                  Update the password for {adminUser.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="space-y-4">
              {passwordState?.error ? (
                <p className="text-sm text-red-300" role="alert">
                  {passwordState.error}
                </p>
              ) : null}
              {passwordState?.success ? (
                <p className="text-sm text-green-400" role="status">
                  {passwordState.success}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-300">
                  Current password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-300">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-white/40">Minimum 8 characters.</p>
              </div>

              <Button
                type="submit"
                disabled={passwordPending}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                <Key className="h-4 w-4" />
                {passwordPending ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
