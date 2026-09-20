import React, { useEffect, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Gauge,
  HeartPulse,
  History,
  Power,
  ScanSearch,
  Settings as SettingsIcon,
  Wifi,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useTranslation } from "../providers/SettingsProvider";
import { NAV_GROUPS, SETTINGS_ITEM, type SectionId } from "../navigation";
import BrandMark from "./BrandMark";
import "./Sidebar.css";

export type { SectionId };

/** Sub-items that appear indented below a parent nav item */
const SUB_ITEMS: Partial<Record<SectionId, { id: string; label: string }[]>> = {
  optimizer: [
    { id: "optimizer#red",     label: "Red" },
    { id: "optimizer#sistema", label: "Sistema" },
    { id: "optimizer#general", label: "General" }
  ],
  gaming: [
    { id: "gaming#detectados", label: "Detectados" },
    { id: "gaming#perfiles",   label: "Perfiles" }
  ]
};

const ICONS: Record<SectionId, LucideIcon> = {
  dashboard:  HeartPulse,
  scan:       ScanSearch,
  processes:  Activity,
  network:    Wifi,
  benchmark:  Gauge,
  optimizer:  Zap,
  startup:    Power,
  gaming:     Gamepad2,
  backup:     History,
  settings:   SettingsIcon
};

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  /** Sub-page within a section (e.g. "red", "sistema", "detectados") */
  activeSubId?: string;
  onSubSelect?: (sectionId: SectionId, subId: string) => void;
}

export default function Sidebar({
  active,
  onSelect,
  activeSubId,
  onSubSelect
}: SidebarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);
  // Track which expandable items are open
  const [expanded, setExpanded] = useState<Partial<Record<SectionId, boolean>>>({
    optimizer: true,
    gaming: true
  });

  useEffect(() => {
    window.app
      ?.getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  // When the active section changes, auto-expand that section
  useEffect(() => {
    if (SUB_ITEMS[active]) {
      setExpanded((prev) => ({ ...prev, [active]: true }));
    }
  }, [active]);

  function toggleExpand(id: SectionId, e: React.MouseEvent): void {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function renderItem(id: SectionId, label: string): React.JSX.Element {
    const Icon = ICONS[id];
    const subs = SUB_ITEMS[id];
    const isActive = active === id;
    const isOpen = !!expanded[id];

    if (subs) {
      return (
        <li key={id}>
          <button
            type="button"
            className="nav__item nav__item--expandable"
            aria-current={isActive ? "page" : undefined}
            aria-expanded={isOpen}
            onClick={(e) => {
              // If already on this section, just toggle; otherwise navigate + expand
              if (!isActive) onSelect(id);
              toggleExpand(id, e);
            }}
          >
            <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
            {isOpen ? (
              <ChevronDown size={14} className="nav__chevron" aria-hidden="true" />
            ) : (
              <ChevronRight size={14} className="nav__chevron" aria-hidden="true" />
            )}
          </button>

          {isOpen && (
            <ul className="nav__sublist">
              {subs.map((sub) => {
                const subActive = isActive && activeSubId === sub.id.split("#")[1];
                return (
                  <li key={sub.id}>
                    <button
                      type="button"
                      className="nav__subitem"
                      aria-current={subActive ? "page" : undefined}
                      onClick={() => {
                        if (!isActive) onSelect(id);
                        onSubSelect?.(id, sub.id.split("#")[1]);
                      }}
                    >
                      {sub.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={id}>
        <button
          type="button"
          className="nav__item"
          aria-current={isActive ? "page" : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <nav className="sidebar" aria-label={t("nav.aria")}>
      <div className="brand">
        <BrandMark />
        <div className="brand__name">
          <span>{t("nav.brand.top")}</span>
          <span>{t("nav.brand.bottom")}</span>
        </div>
      </div>

      <div className="nav__scroll">
        {NAV_GROUPS.map((group, index) => (
          <div key={group.titleKey ?? `group-${index}`} className="nav__group">
            {group.titleKey && <div className="nav__group-title">{t(group.titleKey)}</div>}
            <ul className="nav__list">
              {group.items.map((item) => renderItem(item.id, t(item.labelKey)))}
            </ul>
          </div>
        ))}
      </div>

      <div className="nav__bottom">
        <ul className="nav__list">{renderItem(SETTINGS_ITEM.id, t(SETTINGS_ITEM.labelKey))}</ul>
        {version && <div className="nav__version">{t("nav.version", { version })}</div>}
      </div>
    </nav>
  );
}
