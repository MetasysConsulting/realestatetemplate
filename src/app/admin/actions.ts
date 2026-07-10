"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  isAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin/admin-allowlist";
import { getAdminUserOrNull } from "@/lib/admin/require-admin";

export type AdminAuthState = {
  error?: string;
  success?: string;
} | null;

export async function adminLoginAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const email = normalizeAdminEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!isAdminEmail(email)) {
    return { error: "This account is not authorized for admin access." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: "Invalid email or password." };
    }
  } catch {
    return { error: "Could not sign in. Check Supabase auth configuration." };
  }

  redirect("/admin/home");
}

export async function adminLogoutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.signOut();
  } catch {
    /* still send them to login */
  }
  redirect("/admin/login");
}

export async function adminChangePasswordAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const admin = await getAdminUserOrNull();
  if (!admin?.email) {
    return { error: "You must be signed in to change your password." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }
  if (newPassword === currentPassword) {
    return { error: "New password must be different from the current password." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: admin.email,
      password: currentPassword,
    });
    if (reauthError) {
      return { error: "Current password is incorrect." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message || "Could not update password." };
    }

    return { success: "Password updated successfully." };
  } catch {
    return { error: "Could not update password. Try again." };
  }
}

export async function adminUpdateProfileAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return { error: "You must be signed in to update your profile." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName, name: fullName },
    });
    if (authError) {
      return { error: authError.message || "Could not update account." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (profileError) {
      return { error: profileError.message || "Could not save profile." };
    }

    return { success: "Profile saved." };
  } catch {
    return { error: "Could not save profile. Try again." };
  }
}
