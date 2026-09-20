import { useState, useEffect, useCallback } from "react";
import type { UpdateState, UpdateInfo } from "@shared/types/system";

export interface UseUpdaterReturn {
  state: UpdateState;
  check: () => Promise<UpdateInfo>;
  install: () => Promise<void>;
  checking: boolean;
  installing: boolean;
}

const INITIAL_STATE: UpdateState = {
  status: "idle",
  info: null,
  progress: null,
  error: null
};

export function useUpdater(): UseUpdaterReturn {
  const [state, setState] = useState<UpdateState>(INITIAL_STATE);
  const [checking, setChecking]     = useState(false);
  const [installing, setInstalling] = useState(false);

  // Carga el estado inicial y suscribe a cambios push desde main
  useEffect(() => {
    window.updater.getState().then(setState).catch(console.error);
    const unsub = window.updater.onState(setState);
    return unsub;
  }, []);

  const check = useCallback(async (): Promise<UpdateInfo> => {
    setChecking(true);
    try {
      return await window.updater.check();
    } finally {
      setChecking(false);
    }
  }, []);

  const install = useCallback(async (): Promise<void> => {
    setInstalling(true);
    try {
      await window.updater.install();
    } finally {
      setInstalling(false);
    }
  }, []);

  return { state, check, install, checking, installing };
}
