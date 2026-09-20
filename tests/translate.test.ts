import { describe, it, expect } from "vitest";
import { translate } from "../src/renderer/i18n/translate";
import es from "../src/renderer/i18n/es";
import en from "../src/renderer/i18n/en";

describe("dictionary parity", () => {
  it("ES y EN tienen exactamente las mismas claves (ninguna falta en ninguno de los dos)", () => {
    const esKeys = Object.keys(es).sort();
    const enKeys = Object.keys(en).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it("ninguna traducción está vacía", () => {
    for (const [key, value] of Object.entries(es)) {
      expect(value.length, `es.${key} está vacío`).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value.length, `en.${key} está vacío`).toBeGreaterThan(0);
    }
  });
});

describe("translate", () => {
  it("devuelve el texto correcto para cada idioma", () => {
    expect(translate("es", "nav.dashboard")).toBe("Resumen");
    expect(translate("en", "settings.theme.dark")).toBe("Dark");
    expect(translate("es", "settings.theme.dark")).toBe("Oscuro");
  });

  it("interpola variables con la sintaxis {nombre}", () => {
    expect(translate("es", "dashboard.error", { message: "fallo de prueba" })).toBe(
      "No se pudo leer el hardware: fallo de prueba"
    );
    expect(translate("en", "dashboard.error", { message: "test failure" })).toBe(
      "Couldn't read the hardware: test failure"
    );
  });

  it("trata los valores como texto literal (un nombre con $& no se expande)", () => {
    expect(translate("es", "rec.ram.desc", { name: "a$&b.exe", mb: 10 })).toContain("a$&b.exe");
  });

  it("nunca deja la interfaz en blanco: cae a ES o a la propia clave", () => {
    // @ts-expect-error probamos deliberadamente una clave inexistente
    const result = translate("en", "clave.que.no.existe");
    expect(result).toBe("clave.que.no.existe");
  });
});
