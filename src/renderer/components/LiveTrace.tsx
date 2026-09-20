import React, { useEffect, useRef, useState } from "react";
import type { MetricSample } from "../services/metricHistory";
import "./LiveTrace.css";

interface LiveTraceProps {
  samples: MetricSample[];
  /** Nº de muestras que caben en pantalla; la traza entra por la derecha. */
  windowSize?: number;
  height?: number;
  cpuLabel: string;
  ramLabel: string;
  ariaLabel: string;
  emptyText: string;
}

interface Point {
  x: number;
  y: number;
}

/** Curva suave que pasa por los puntos medios (sin rebasar los valores reales). */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${points[i].x},${points[i].y} ${midX},${midY}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last.x},${last.y}`;
}

/**
 * Coloca las etiquetas directas (CPU / RAM) junto al último punto de cada
 * línea: dentro del área visible y sin pisarse entre sí.
 */
export function placeLabels(
  cpuY: number | null,
  ramY: number | null,
  min: number,
  max: number,
  gap: number
): { cpu: number | null; ram: number | null } {
  const clamp = (v: number): number => Math.max(min, Math.min(max, v));
  const cpu = cpuY == null ? null : clamp(cpuY);
  const ram = ramY == null ? null : clamp(ramY);
  if (cpu == null || ram == null || Math.abs(cpu - ram) >= gap) return { cpu, ram };

  const mid = (cpu + ram) / 2;
  let top = mid - gap / 2;
  let bottom = mid + gap / 2;
  if (bottom > max) {
    bottom = max;
    top = max - gap;
  }
  if (top < min) {
    top = min;
    bottom = min + gap;
  }
  return cpu <= ram ? { cpu: top, ram: bottom } : { cpu: bottom, ram: top };
}

export default function LiveTrace({
  samples,
  windowSize = 60,
  height = 210,
  cpuLabel,
  ramLabel,
  ariaLabel,
  emptyText
}: LiveTraceProps): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(320, Math.round(el.clientWidth)));
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(320, Math.round(w)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const padLeft = 34;
  const padRight = 92;
  const padTop = 12;
  const padBottom = 8;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const step = innerW / (windowSize - 1);
  const rightX = padLeft + innerW;

  const yFor = (value: number): number => padTop + (1 - Math.max(0, Math.min(100, value)) / 100) * innerH;

  const build = (key: "cpu" | "ram"): Point[] => {
    const pts: Point[] = [];
    samples.forEach((s, i) => {
      const v = s[key];
      if (v == null) return;
      pts.push({ x: rightX - (samples.length - 1 - i) * step, y: yFor(v) });
    });
    return pts;
  };

  const cpuPts = build("cpu");
  const ramPts = build("ram");
  const hasData = cpuPts.length >= 2 || ramPts.length >= 2;

  const lastCpu = cpuPts[cpuPts.length - 1];
  const lastRam = ramPts[ramPts.length - 1];
  const lastCpuValue = [...samples].reverse().find((s) => s.cpu != null)?.cpu ?? null;
  const lastRamValue = [...samples].reverse().find((s) => s.ram != null)?.ram ?? null;

  // Cada etiqueta ocupa dos líneas (nombre y valor) centradas en su Y.
  const labels = placeLabels(lastCpu?.y ?? null, lastRam?.y ?? null, padTop + 12, height - padBottom - 14, 36);
  const cpuLabelY = labels.cpu ?? 0;
  const ramLabelY = labels.ram ?? 0;

  const cpuLine = smoothPath(cpuPts);
  const cpuArea =
    cpuPts.length >= 2
      ? `${cpuLine} L${cpuPts[cpuPts.length - 1].x},${padTop + innerH} L${cpuPts[0].x},${padTop + innerH} Z`
      : "";

  return (
    <div ref={wrapRef} className="trace" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id="trace-cpu-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.34 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {[0, 50, 100].map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? "trace__axis" : "trace__grid"}
              x1={padLeft}
              x2={rightX}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <text className="trace__tick" x={padLeft - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle">
              {tick}
            </text>
          </g>
        ))}

        {!hasData && (
          <text className="trace__empty" x={padLeft + innerW / 2} y={height / 2} textAnchor="middle">
            {emptyText}
          </text>
        )}

        {cpuArea && <path d={cpuArea} fill="url(#trace-cpu-fill)" />}
        {cpuPts.length >= 2 && <path className="trace__cpu" d={cpuLine} />}
        {ramPts.length >= 2 && <path className="trace__ram" d={smoothPath(ramPts)} />}

        {lastCpu && hasData && (
          <g>
            <circle className="trace__dot trace__dot--cpu" cx={lastCpu.x} cy={lastCpu.y} r={4.5} />
            <text className="trace__label trace__label--cpu" x={lastCpu.x + 12} y={cpuLabelY - 8} dominantBaseline="middle">
              {cpuLabel}
            </text>
            <text className="trace__value trace__label--cpu" x={lastCpu.x + 12} y={cpuLabelY + 8} dominantBaseline="middle">
              {lastCpuValue != null ? `${Math.round(lastCpuValue)} %` : ""}
            </text>
          </g>
        )}
        {lastRam && hasData && (
          <g>
            <circle className="trace__dot trace__dot--ram" cx={lastRam.x} cy={lastRam.y} r={4.5} />
            <text className="trace__label trace__label--ram" x={lastRam.x + 12} y={ramLabelY - 8} dominantBaseline="middle">
              {ramLabel}
            </text>
            <text className="trace__value trace__label--ram" x={lastRam.x + 12} y={ramLabelY + 8} dominantBaseline="middle">
              {lastRamValue != null ? `${Math.round(lastRamValue)} %` : ""}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
