import type { Metadata } from "next";
import { AuthForm } from "@/components/site/auth-form";
import { AuthShell } from "@/components/site/auth-shell";

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Daftar gratis di UndanganE dan mulai buat undangan digital dalam hitungan menit.",
  alternates: { canonical: "/daftar" },
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthShell mode="daftar">
      <AuthForm mode="daftar" />
    </AuthShell>
  );
}
