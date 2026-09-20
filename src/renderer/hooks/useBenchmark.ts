import { useCallback, useEffect, useState } from "react";
import type { BenchmarkState } from "@shared/types/system";

interface State {
  benchmark: BenchmarkState;
  loading: boolean;
  capturing: "before" | "after" | null;
}

export function useBenchmark() {
  const [state, setState] = useState<State>({ benchmark: { before: null, after: null }, loading: true, capturing: null });

  const refresh = useCallback(async () => {
    const benchmark = await window.benchmark.getState();
    setState((prev) => ({ ...prev, benchmark, loading: false }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const captureBefore = useCallback(async () => {
    setState((prev) => ({ ...prev, capturing: "before" }));
    await window.benchmark.captureBefore();
    await refresh();
    setState((prev) => ({ ...prev, capturing: null }));
  }, [refresh]);

  const captureAfter = useCallback(async () => {
    setState((prev) => ({ ...prev, capturing: "after" }));
    await window.benchmark.captureAfter();
    await refresh();
    setState((prev) => ({ ...prev, capturing: null }));
  }, [refresh]);

  const reset = useCallback(async () => {
    await window.benchmark.reset();
    await refresh();
  }, [refresh]);

  return { ...state, captureBefore, captureAfter, reset };
}
