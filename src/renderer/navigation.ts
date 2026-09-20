import type { TranslationKey } from "./i18n/es";

export type SectionId =
  | "dashboard"
  | "scan"
  | "optimizer"
  | "startup"
  | "processes"
  | "gaming"
  | "network"
  | "benchmark"
  | "backup"
  | "settings";

export interface NavGroup {
  /** `null` = grupo sin título (el resumen, arriba del todo). */
  titleKey: TranslationKey | null;
  items: { id: SectionId; labelKey: TranslationKey }[];
}

export const NAV_GROUPS: NavGroup[] = [
  { titleKey: null, items: [{ id: "dashboard", labelKey: "nav.dashboard" }] },
  {
    titleKey: "nav.group.diagnose",
    items: [
      { id: "scan", labelKey: "nav.scan" },
      { id: "processes", labelKey: "nav.processes" },
      { id: "network", labelKey: "nav.network" },
      { id: "benchmark", labelKey: "nav.benchmark" }
    ]
  },
  {
    titleKey: "nav.group.improve",
    items: [
      { id: "optimizer", labelKey: "nav.optimizer" },
      { id: "startup", labelKey: "nav.startup" },
      { id: "gaming", labelKey: "nav.gaming" },
      { id: "backup", labelKey: "nav.backup" }
    ]
  }
];

export const SETTINGS_ITEM = { id: "settings" as SectionId, labelKey: "nav.settings" as TranslationKey };
