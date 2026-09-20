import { useCallback, useEffect, useState } from "react";
import type { RestorePoint } from "@shared/types/system";

interface State {
  points: RestorePoint[];
  loading: boolean;
  error: string | null;
}

export function useRestoreCenter() {
  const [state, setState] = useState<State>({ points: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const points = await window.backup.listAllRestorePoints();
      setState({ points, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido al leer los puntos de restauración."
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
