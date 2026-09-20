import { useEffect, useRef, useState } from "react";
import type { HardwareSnapshot } from "@shared/types/system";

interface State {
  data: HardwareSnapshot | null;
  loading: boolean;
  error: string | null;
}

/**
 * Refresca el snapshot de hardware cada `intervalMs`. Se usa un intervalo
 * moderado (por defecto 4s) para respetar el objetivo de bajo consumo de
 * la propia app (regla #20: evitar polling excesivo).
 */
export function useHardwareSnapshot(intervalMs = 4000): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function fetchSnapshot() {
      try {
        const snapshot = await window.system.getHardwareSnapshot();
        if (mounted.current) {
          setState({ data: snapshot, loading: false, error: null });
        }
      } catch (err) {
        if (mounted.current) {
          setState((prev) => ({
            data: prev.data,
            loading: false,
            error: err instanceof Error ? err.message : "Error desconocido al leer el hardware."
          }));
        }
      }
    }

    fetchSnapshot();
    const id = window.setInterval(fetchSnapshot, intervalMs);

    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
