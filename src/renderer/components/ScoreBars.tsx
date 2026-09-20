import React from "react";
import type { HealthTone } from "../services/healthVerdict";
import "./ScoreBars.css";

const TICKS = 20;

/** Escala de 20 marcas, como el indicador de señal de un móvil: cuántas están encendidas depende de la puntuación. */
export default function ScoreBars({ score, tone }: { score: number | null; tone: HealthTone }): React.JSX.Element {
  const lit = score == null ? 0 : Math.round((Math.max(0, Math.min(100, score)) / 100) * TICKS);
  return (
    <div className={`score-bars score-bars--${tone}`} aria-hidden="true">
      {Array.from({ length: TICKS }, (_, i) => (
        <span key={i} className={`score-bars__tick ${i < lit ? "score-bars__tick--on" : ""}`} />
      ))}
    </div>
  );
}
