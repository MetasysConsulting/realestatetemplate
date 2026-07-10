import { redirect } from "next/navigation";

/** Admin accounts are invite-only — no self-registration. */
export default function AdminRegisterPage() {
  redirect("/admin/login");
}
