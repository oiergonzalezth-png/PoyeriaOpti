import type { OperationResult, TweakRisk } from "@shared/types/system";

/**
 * Interfaz interna de un tweak (regla #30 del proyecto). No se expone
 * directamente al renderer — el renderer solo ve el DTO `TweakDefinition`
 * (ver `shared/types/system.ts`), construido a partir de esto + `check()`.
 */
export interface Tweak {
  id: string;
  name: string;
  description: string;
  category: string;
  risk: TweakRisk;
  impact: string;
  requiresAdmin: boolean;

  /** Determina si el tweak está aplicado actualmente. `null` si no se puede saber con certeza. */
  check(): Promise<boolean | null>;

  /** Aplica el tweak. Debe guardar un punto de restauración ANTES de escribir nada. */
  apply(): Promise<OperationResult>;

  /**
   * Revierte el tweak a partir del `previousValue` guardado en su punto de
   * restauración más reciente sin restaurar. No vuelve a leer el estado
   * "actual": usa exactamente lo que se guardó al aplicar.
   */
  revertFromValue(previousValue: unknown): Promise<OperationResult>;
}
