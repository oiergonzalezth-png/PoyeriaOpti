import { useCallback, useState } from "react";
import type { NetworkTestResult } from "@shared/types/system";

interface State {
  result: NetworkTestResult | null;
  running: boolean;
  error: string | null;
}

export function useNetworkTest() {
  const [state, setState] = useState<State>({ result: null, running: false, error: null });

  const runTest = useCallback(async () => {
    setState((prev) => ({ ...prev, running: true, error: null }));
    try {
      const result = await window.network.runNetworkTest();
      setState({ result, running: false, error: null });
    } catch (err) {
      setState({
        result: null,
        running: false,
        error: err instanceof Error ? err.message : "Error desconocido al ejecutar el test de red."
      });
    }
  }, []);

  return { ...state, runTest };
}
