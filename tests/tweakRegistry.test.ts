import { describe, it, expect } from "vitest";
import { listTweakDefinitions, applyTweakById, restoreTweakById } from "../src/main/optimizer/tweakRegistry";

// Lista de patrones que la regla #31 del proyecto prohíbe explícitamente
// en cualquier tweak (nombres o descripciones "mágicas"/destructivas).
const FORBIDDEN_PATTERNS = [/fps\s*x\s*2/i, /reduce (el )?ping a 0/i, /elimina(r)? (el )?input lag/i, /secreto/i, /mágic/i];

describe("optimizer tweak registry", () => {
  it("expone al menos 5 tweaks, sin límite superior artificial (regla #30)", async () => {
    const defs = await listTweakDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(5);
  });

  it("todos los tweaks tienen id único y los campos requeridos", async () => {
    const defs = await listTweakDefinitions();
    const ids = new Set(defs.map((d) => d.id));
    expect(ids.size).toBe(defs.length);

    for (const def of defs) {
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      expect(["LOW", "MEDIUM", "HIGH"]).toContain(def.risk);
      expect(["NOT_APPLIED", "APPLIED", "UNKNOWN"]).toContain(def.status);
    }
  });

  it("ningún tweak usa lenguaje exagerado o prohibido por la regla #31", async () => {
    const defs = await listTweakDefinitions();
    for (const def of defs) {
      const text = `${def.name} ${def.description}`;
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(text).not.toMatch(pattern);
      }
    }
  });

  it("ningún tweak es de riesgo HIGH en este lote inicial de bajo riesgo", async () => {
    const defs = await listTweakDefinitions();
    expect(defs.every((d) => d.risk !== "HIGH")).toBe(true);
  });

  it("aplicar/restaurar un id desconocido devuelve un error claro, sin fingir éxito", async () => {
    const applyResult = await applyTweakById("tweak-que-no-existe");
    expect(applyResult.success).toBe(false);
    expect(applyResult.error).toBe("UNKNOWN_TWEAK");

    const restoreResult = await restoreTweakById("tweak-que-no-existe");
    expect(restoreResult.success).toBe(false);
    expect(restoreResult.error).toBe("UNKNOWN_TWEAK");
  });

  it("un tweak real, en una plataforma no soportada, nunca finge éxito", async () => {
    const defs = await listTweakDefinitions();
    const anyTweakId = defs[0].id;
    const result = await applyTweakById(anyTweakId);
    // En este entorno de test (no Windows), debe fallar explícitamente.
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNSUPPORTED_PLATFORM");
  });

  it("restaurar un tweak real en una plataforma no soportada nunca finge éxito", async () => {
    const defs = await listTweakDefinitions();
    const anyTweakId = defs[defs.length - 1].id;
    const result = await restoreTweakById(anyTweakId);
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNSUPPORTED_PLATFORM");
  });
});
