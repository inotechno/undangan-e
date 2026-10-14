import type { Metadata } from "next";
import { AuthShell } from "@/components/site/auth-shell";
import { LupaPasswordForm } from "./lupa-password-form";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Reset password akun UndanganE Anda melalui email.",
  robots: { index: false },
};

export default function LupaPasswordPage() {
  return (
    <AuthShell mode="lupa">
      <LupaPasswordForm />
    </AuthShell>
  );
}
