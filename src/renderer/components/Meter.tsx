import React from "react";

export type MeterTone = "accent" | "ok" | "warn" | "danger";

/** Tono para métricas donde MÁS uso = peor (CPU, RAM, disco). */
export function usageTone(percent: number): MeterTone {
  if (percent >= 90) return "danger";
  if (percent >= 75) return "warn";
  return "accent";
}

interface MeterProps {
  value: number;
  tone?: MeterTone;
  label?: string;
}

export default function Meter({ value, tone, label }: MeterProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));
  const resolved = tone ?? usageTone(clamped);
  return (
    <div
      className={`meter ${resolved === "accent" ? "" : `meter--${resolved}`}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
    >
      <div className="meter__fill" style={{ "--v": `${clamped}%` } as React.CSSProperties} />
    </div>
  );
}
