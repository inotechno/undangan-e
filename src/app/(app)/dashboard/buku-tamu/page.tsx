import type { Metadata } from "next";
import { requireAuth } from "@/auth/guard";
import { listCheckInsForOwner } from "@/modules/guests/server";
import { BukuTamuClient } from "./buku-tamu-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Buku Tamu — UndanganE",
  robots: { index: false, follow: false },
};

export default async function BukuTamuPage() {
  const { session } = await requireAuth();
  const data = await listCheckInsForOwner(session.user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Buku Tamu</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Rekap check-in tamu dari seluruh undangan Anda.
        </p>
      </div>
      <BukuTamuClient initial={data} />
    </div>
  );
}
