import type { Metadata } from "next";
import { requireAuth } from "@/auth/guard";
import { listWishesForOwnerAll } from "@/modules/guests/wishes";
import { UcapanClient } from "./ucapan-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Pesan & Ucapan — UndanganE",
  robots: { index: false, follow: false },
};

export default async function UcapanPage() {
  const { session } = await requireAuth();
  const data = await listWishesForOwnerAll(session.user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Pesan &amp; Ucapan</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Moderasi ucapan dari semua undangan Anda. Sembunyikan atau hapus yang tidak pantas.
        </p>
      </div>
      <UcapanClient initial={data} />
    </div>
  );
}
