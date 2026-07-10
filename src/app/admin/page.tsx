import { redirect } from "next/navigation";
import { getAdminUserOrNull } from "@/lib/admin/require-admin";

export default async function AdminIndexPage() {
  const admin = await getAdminUserOrNull();
  redirect(admin ? "/admin/home" : "/admin/login");
}
