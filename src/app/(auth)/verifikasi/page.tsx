import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/site/auth-shell";
import { VerifikasiForm } from "./verifikasi-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Verifikasi email Anda untuk mengaktifkan akun UndanganE.",
  robots: { index: false },
};

export default function VerifikasiPage() {
  return (
    <AuthShell mode="verifikasi">
      <Suspense fallback={null}>
        <VerifikasiForm />
      </Suspense>
    </AuthShell>
  );
}
