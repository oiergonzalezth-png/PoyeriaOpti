import { useCallback, useEffect, useState } from "react";
import type { StartupItemInfo, RestorePoint } from "@shared/types/system";

interface State {
  items: StartupItemInfo[];
  restorePoints: RestorePoint[];
  loading: boolean;
  error: string | null;
}

export function useStartupManager() {
  const [state, setState] = useState<State>({ items: [], restorePoints: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const [items, restorePoints] = await Promise.all([
        window.system.getStartupItems(),
        window.system.getStartupRestorePoints()
      ]);
      setState({ items, restorePoints, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido al leer los elementos de inicio."
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
