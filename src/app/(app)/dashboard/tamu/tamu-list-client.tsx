"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";

export type TamuInvitationItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  guests: number;
  attending: number;
};

const PER_PAGE = 10;

export function TamuListClient({ items }: { items: TamuInvitationItem[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(items, safePage, PER_PAGE);

  return (
    <div>
      <div className="grid gap-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)] sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-bold tracking-[-0.2px] text-charcoal">
                  {item.title}
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-muted-warm">
                  /{item.slug} · {item.status === "active" ? "Dipublikasikan" : item.status}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <strong className="block text-[15px] font-extrabold text-charcoal">
                    {item.guests.toLocaleString("id-ID")}
                  </strong>
                  <span className="text-[10px] text-muted-warm">Tamu</span>
                </div>
                <div className="text-right">
                  <strong className="block text-[15px] font-extrabold text-charcoal">
                    {item.attending.toLocaleString("id-ID")}
                  </strong>
                  <span className="text-[10px] text-muted-warm">Hadir</span>
                </div>
                <Link
                  href={`/dashboard/tamu/${item.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
                >
                  <Users className="size-3.5" aria-hidden />
                  Kelola Tamu
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 ? (
        <p className="mt-3 text-center text-[10px] text-muted-warm">
          Menampilkan {visible.length} dari {items.length} undangan
        </p>
      ) : null}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman tamu" />
    </div>
  );
}
