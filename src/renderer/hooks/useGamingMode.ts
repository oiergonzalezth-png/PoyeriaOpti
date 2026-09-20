import { useCallback, useEffect, useState } from "react";
import type { GameProfile, GamingModeStatus, TweakDefinition, DetectedGameInfo } from "@shared/types/system";

interface State {
  status: GamingModeStatus | null;
  profiles: GameProfile[];
  tweaks: TweakDefinition[];
  detectedGames: DetectedGameInfo[];
  scanning: boolean;
  loading: boolean;
  error: string | null;
}

export function useGamingMode() {
  const [state, setState] = useState<State>({
    status: null,
    profiles: [],
    tweaks: [],
    detectedGames: [],
    scanning: false,
    loading: true,
    error: null
  });

  const refresh = useCallback(async () => {
    try {
      const [status, profiles, tweaks] = await Promise.all([
        window.gaming.getStatus(),
        window.gaming.listProfiles(),
        window.optimizer.listTweaks()
      ]);
      setState((prev) => ({ ...prev, status, profiles, tweaks, loading: false, error: null }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido al leer Gaming Mode."
      }));
    }
  }, []);

  const scanGames = useCallback(async () => {
    setState((prev) => ({ ...prev, scanning: true }));
    try {
      const detectedGames = await window.gaming.detectGames();
      setState((prev) => ({ ...prev, detectedGames, scanning: false }));
    } catch {
      setState((prev) => ({ ...prev, scanning: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    // Escaneo inicial en segundo plano (puede tardar si escanea disco)
    scanGames();
  }, [refresh, scanGames]);

  return { ...state, refresh, scanGames };
}
