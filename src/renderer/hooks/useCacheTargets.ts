import { useCallback, useEffect, useState } from "react";
import type { CacheTargetInfo, OperationResult } from "@shared/types/system";

interface State {
  targets: CacheTargetInfo[];
  loading: boolean;
  error: string | null;
}

/**
 * Cachés "limpiables" del Optimizador (Red/Sistema/General). A diferencia
 * de `useOptimizer`, esto no tiene apply/restore: limpiar es un solo
 * sentido, así que solo hay `scan` (refrescar tamaños) y `clear` (limpiar
 * un target y volver a escanear para reflejar el tamaño real que queda).
 */
export function useCacheTargets() {
  const [state, setState] = useState<State>({ targets: [], loading: true, error: null });
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const targets = await window.cache.scan();
      setState({ targets, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido al leer las cachés."
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clear = useCallback(
    async (id: string): Promise<OperationResult> => {
      setBusyId(id);
      try {
        const result = await window.cache.clear(id);
        await refresh();
        return result;
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  const flushDns = useCallback(async (): Promise<OperationResult> => {
    setBusyId("__flush-dns__");
    try {
      return await window.cache.flushDns();
    } finally {
      setBusyId(null);
    }
  }, []);

  return { ...state, busyId, refresh, clear, flushDns };
}
