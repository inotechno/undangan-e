"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Autosave config editor → PATCH /api/invitations/[id] dengan debounce.
 * Hasil penyimpanan terakhir ada di server, jadi reload tidak menghilangkan data.
 */
export function useAutosave(invitationId: string, config: unknown) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);
  const dirty = useRef(false);

  const saveNow = useCallback(
    async (payload: { config?: unknown; slug?: string }) => {
      setState("saving");
      try {
        const res = await fetch(`/api/invitations/${invitationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Gagal menyimpan");
          setState("error");
          return false;
        }
        setError(null);
        dirty.current = false;
        setState("saved");
        return true;
      } catch {
        setError("Gagal terhubung ke server");
        setState("error");
        return false;
      }
    },
    [invitationId],
  );

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    dirty.current = true;
    setState("saving");
    const t = setTimeout(() => {
      void saveNow({ config });
    }, 800);
    return () => clearTimeout(t);
  }, [config, saveNow]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return { state, error, saveNow };
}
