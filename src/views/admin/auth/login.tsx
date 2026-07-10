"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import { ReovanaLogo } from "@/components/admin/reovana-logo";
import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";

export default function Login() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const goToDashboard = () => {
    startTransition(() => {
      router.push("/admin/home");
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToDashboard();
  };

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
                Admin sign in
              </CardTitle>
              <CardDescription className="text-[15px] text-white/55">
                Manage listings, feeds, and site analytics
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/80">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@reovana.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white/80"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-1 h-11 w-full bg-primary text-white hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? "Signing in…" : "Sign in"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
                onClick={goToDashboard}
                disabled={isPending}
              >
                Continue without login
              </Button>

              <p className="pt-1 text-center text-xs leading-relaxed text-white/40">
                Demo access — no backend auth wired yet.
              </p>

              <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-4 text-sm">
                <a
                  href={REOVANA_BRAND.localPublicSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  View public site
                </a>
                <span className="text-white/20">·</span>
                <Link href="/admin/register" className="font-medium text-white/70 hover:text-white">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
