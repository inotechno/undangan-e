"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { signOut } from "@/auth/client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function AppTopbar({ userName }: { userName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border-warm bg-white px-4 lg:h-[76px] lg:px-8">
      <form
        onSubmit={submitSearch}
        role="search"
        className="flex h-10 w-full max-w-[490px] items-center gap-2.5 rounded-xl border border-[#e0e8ed] bg-[#fbfcfd] px-3.5 text-[#8a99a6]"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari undangan, template, atau fitur..."
          aria-label="Pencarian global"
          className="w-full bg-transparent text-[13px] text-charcoal outline-none placeholder:text-[#8a99a6]"
        />
      </form>

      <div className="flex items-center gap-3 pl-1">
        <button
          type="button"
          aria-label="Notifikasi"
          title="Notifikasi"
          className="relative grid size-10 place-items-center rounded-xl border border-border-warm bg-white text-[#506674] transition-colors hover:border-teal hover:text-teal"
          onClick={() => alert("Belum ada notifikasi baru.")}
        >
          <Bell className="size-[17px]" aria-hidden />
          <span className="absolute top-1.5 right-2 size-[7px] rounded-full bg-[#e05264]" aria-hidden />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e1efed] text-xs font-extrabold text-teal-dark">
            {initials(userName)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <strong className="block max-w-[160px] truncate text-xs text-charcoal">{userName}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => {
                router.push("/masuk");
              });
            }}
            aria-label="Keluar"
            title="Keluar"
            className="grid size-9 place-items-center rounded-xl border border-border-warm bg-white text-[#506674] transition-colors hover:border-teal hover:text-teal"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
