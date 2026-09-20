import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AppSettings } from "@shared/types/system";
import { translate } from "../i18n/translate";
import type { TranslationKey } from "../i18n/es";

const DEFAULT_SETTINGS: AppSettings = {
  startWithWindows: false,
  minimizeToTray: false,
  notificationsEnabled: true,
  theme: "dark",
  language: "es"
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.settings
      .getSettings()
      .then((s) => setSettings(s))
      .catch(() => {
        /* Se conservan los ajustes por defecto: la app sigue siendo usable. */
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // El tema se aplica en <html>; tokens.css define las variables para
    // :root[data-theme="light"] (por defecto la app es oscura).
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language;
  }, [settings.theme, settings.language]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await window.settings.updateSettings(partial);
    setSettings(next);
    return next;
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(settings.language, key, vars),
    [settings.language]
  );

  return <SettingsContext.Provider value={{ settings, loading, updateSettings, t }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings debe usarse dentro de <SettingsProvider>");
  }
  return ctx;
}

/** Atajo para componentes que solo necesitan `t()`. */
export function useTranslation(): Pick<SettingsContextValue, "t"> {
  const { t } = useSettings();
  return { t };
}

/** Versión "render prop" para componentes de clase (p. ej. el ErrorBoundary). */
export function SettingsContextConsumer({
  children
}: {
  children: (value: SettingsContextValue) => React.ReactNode;
}): React.JSX.Element {
  return <>{children(useSettings())}</>;
}
