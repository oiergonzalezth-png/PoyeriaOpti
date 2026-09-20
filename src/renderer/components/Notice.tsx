import React from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

export type NoticeTone = "info" | "ok" | "warn" | "danger";

const ICONS = { info: Info, ok: CircleCheck, warn: TriangleAlert, danger: CircleX } as const;

interface NoticeProps {
  tone?: NoticeTone;
  children: React.ReactNode;
}

/** Aviso en línea. Los errores se anuncian a lectores de pantalla como alertas; el resto, como estado. */
export default function Notice({ tone = "info", children }: NoticeProps): React.JSX.Element {
  const Icon = ICONS[tone];
  return (
    <div className={`notice notice--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
