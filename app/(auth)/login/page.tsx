"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { BrandMark } from "@/components/public/brand-logo";
import { DynamicForm } from "@/lib/forms/dynamic-form";
import { loginSchema } from "@/lib/forms/schemas";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const errorCode = searchParams.get("error");
  const banner = errorBanner(errorCode);

  async function handleLogin(values: Record<string, unknown>) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      // ponytail: next-auth/react.js parses the server-returned URL and exposes
      // `?error=<code>` as result.error (and nullifies result.url when error is set).
      // For codes with a dedicated banner (pending-approval, google-link-required),
      // hard-navigate to /login?error=<code> so the banner renders — router.push
      // to same-pathname-with-query-change won't trigger a server re-render.
      if (result?.error && errorBanner(result.error)) {
        window.location.href = `/login?error=${result.error}`;
      } else if (result?.error) {
        toast.error("Email atau password salah");
      } else {
        toast.success("Berhasil masuk!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pub-scope min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 font-black text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-600/25">
              <BrandMark className="h-6 w-6" />
            </span>
            hive<span className="text-[var(--color-primary)]">POS</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Masuk ke Dashboard</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2">Selamat datang kembali</p>
        </div>

        {banner && (
          <div
            role="alert"
            className="mb-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">{banner.title}</p>
              <p className="text-amber-800">{banner.body}</p>
            </div>
          </div>
        )}

        <DynamicForm schema={loginSchema} onSubmit={handleLogin} disabled={loading} />

        {/* Google OAuth — shows only if configured */}
        {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-background)] px-2 text-[var(--color-muted-foreground)]">
                  atau
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-3 rounded-xl border border-[var(--color-border)] font-semibold flex items-center justify-center gap-3 hover:bg-[var(--color-muted)] transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </button>
          </>
        )}

        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Belum punya akun?{" "}
            <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
              Daftar bisnis baru
            </Link>
          </p>
          {/* ponytail: server-side redirect of authed SUPER_ADMIN → /super-admin is deferred.
              Middleware already bounces authed users off /login; this link covers the real
              pain (unauth super-admin landing here). Add role-aware middleware later. */}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Platform staff?{" "}
            <Link
              href="/super-admin/login"
              className="font-semibold text-[var(--color-muted-foreground)] underline hover:text-foreground"
            >
              Masuk panel
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ponytail: maps Auth.js error codes to Indonesian banner copy.
// Add codes here as new failure modes surface; keep the default
// short and actionable ("retry or use password").
function errorBanner(code: string | null):
  | { title: string; body: string }
  | null {
  if (!code) return null;
  switch (code) {
    case "google-link-required":
      return {
        title: "Akun ini terdaftar dengan password",
        body: "Email ini sudah punya akun hivePOS. Masuk dulu dengan password Anda, lalu hubungkan Google dari menu Profil.",
      };
    case "pending-approval":
      return {
        title: "Akun menunggu persetujuan",
        body: "Pendaftaran Anda sedang ditinjau admin. Coba lagi nanti.",
      };
    case "Configuration":
    case "AccessDenied":
    case "OAuthCallback":
    case "OAuthCallbackError":
      return {
        title: "Login Google gagal",
        body: "Coba lagi, atau masuk dengan password Anda.",
      };
    default:
      return null;
  }
}
