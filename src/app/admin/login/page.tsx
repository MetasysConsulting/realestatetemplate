import { Suspense } from "react";
import Login from "@/views/admin/auth/login";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-root flex min-h-screen items-center justify-center text-white/60">
          Loading…
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
