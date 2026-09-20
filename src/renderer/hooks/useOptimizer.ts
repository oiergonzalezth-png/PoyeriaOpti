import { useCallback, useEffect, useState } from "react";
import type { TweakDefinition } from "@shared/types/system";

interface State {
  tweaks: TweakDefinition[];
  loading: boolean;
  error: string | null;
}

export function useOptimizer() {
  const [state, setState] = useState<State>({ tweaks: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const tweaks = await window.optimizer.listTweaks();
      setState({ tweaks, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido al leer las optimizaciones."
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
