export type HealthTone = "good" | "tight" | "bad" | "none";

/** Traduce la puntuación 0-100 a una frase y un tono. Umbrales iguales a los del cálculo de salud. */
export function healthTone(score: number | null): HealthTone {
  if (score == null) return "none";
  if (score >= 75) return "good";
  if (score >= 45) return "tight";
  return "bad";
}
