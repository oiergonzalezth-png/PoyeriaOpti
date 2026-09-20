import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessInfo } from "@shared/types/system";

interface State {
  processes: ProcessInfo[];
  loading: boolean;
  error: string | null;
}

export function useProcesses(intervalMs = 5000): State & { refresh: () => Promise<void> } {
  const [state, setState] = useState<State>({ processes: [], loading: true, error: null });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const processes = await window.system.getProcesses();
      if (mounted.current) {
        setState({ processes, loading: false, error: null });
      }
    } catch (err) {
      if (mounted.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Error desconocido al leer los procesos."
        }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const id = window.setInterval(refresh, intervalMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [refresh, intervalMs]);

  return { ...state, refresh };
}
