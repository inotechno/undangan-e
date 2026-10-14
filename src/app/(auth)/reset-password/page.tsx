import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/site/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Buat password baru untuk akun UndanganE Anda.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell mode="reset">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
