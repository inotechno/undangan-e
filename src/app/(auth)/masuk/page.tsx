import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/site/auth-form";
import { AuthShell } from "@/components/site/auth-shell";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun UndanganE untuk mengelola undangan digitalmu.",
  alternates: { canonical: "/masuk" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthShell mode="masuk">
      <Suspense fallback={null}>
        <AuthForm mode="masuk" />
      </Suspense>
    </AuthShell>
  );
}
