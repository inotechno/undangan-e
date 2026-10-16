"use client";

import { useCallback, useRef, useState } from "react";
import type { InvitationConfig } from "@/modules/invitation";

const MAX_HISTORY = 50;

/**
 * State config dengan undo/redo history (tanpa dependensi tambahan).
 * mutate() menerima draft — setiap perubahan menambah entry history.
 */
export function useUndoableConfig(initial: InvitationConfig) {
  const [config, setConfig] = useState<InvitationConfig>(initial);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const past = useRef<InvitationConfig[]>([]);
  const future = useRef<InvitationConfig[]>([]);

  const syncHistory = useCallback(() => {
    setHistoryState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });
  }, []);

  const mutate = useCallback(
    (fn: (draft: InvitationConfig) => void) => {
      setConfig((prev) => {
        const next = structuredClone(prev);
        fn(next);
        past.current.push(prev);
        if (past.current.length > MAX_HISTORY) past.current.shift();
        future.current = [];
        return next;
      });
      syncHistory();
    },
    [syncHistory],
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setConfig((current) => {
      const prev = past.current.pop()!;
      future.current.push(current);
      return prev;
    });
    syncHistory();
  }, [syncHistory]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setConfig((current) => {
      const next = future.current.pop()!;
      past.current.push(current);
      return next;
    });
    syncHistory();
  }, [syncHistory]);

  return {
    config,
    mutate,
    undo,
    redo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
  };
}
