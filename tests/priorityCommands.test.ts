import { describe, it, expect } from "vitest";
import {
  toPsPriority,
  isValidPsPriority,
  buildGetPrioritiesScript,
  parsePrioritiesJson,
  buildSetPrioritiesScript,
  parseSetPrioritiesOutput
} from "../src/main/gaming/priorityCommands";

describe("toPsPriority", () => {
  it("mapea HIGH/NORMAL a los nombres de PowerShell", () => {
    expect(toPsPriority("HIGH")).toBe("High");
    expect(toPsPriority("NORMAL")).toBe("Normal");
  });
});

describe("isValidPsPriority", () => {
  it("acepta solo High/Normal/BelowNormal", () => {
    expect(isValidPsPriority("High")).toBe(true);
    expect(isValidPsPriority("Normal")).toBe(true);
    expect(isValidPsPriority("BelowNormal")).toBe(true);
  });

  it("rechaza RealTime e Idle (prohibidos por seguridad) y valores inventados", () => {
    expect(isValidPsPriority("RealTime")).toBe(false);
    expect(isValidPsPriority("Idle")).toBe(false);
    expect(isValidPsPriority("Whatever")).toBe(false);
  });
});

describe("buildGetPrioritiesScript / parsePrioritiesJson", () => {
  it("construye un script con la lista de PIDs", () => {
    const script = buildGetPrioritiesScript([111, 222]);
    expect(script).toContain("111,222");
    expect(script).toContain("Get-Process");
  });

  it("parsea un único resultado (objeto suelto, no array)", () => {
    const map = parsePrioritiesJson('{"Id":111,"PriorityClass":"Normal"}');
    expect(map.get(111)).toBe("Normal");
  });

  it("parsea varios resultados (array)", () => {
    const map = parsePrioritiesJson('[{"Id":111,"PriorityClass":"Normal"},{"Id":222,"PriorityClass":"High"}]');
    expect(map.get(111)).toBe("Normal");
    expect(map.get(222)).toBe("High");
  });

  it("ignora salida vacía o corrupta sin lanzar", () => {
    expect(parsePrioritiesJson("").size).toBe(0);
    expect(parsePrioritiesJson("no es json").size).toBe(0);
  });

  it("descarta entradas con un valor de prioridad desconocido, en vez de inventarlo", () => {
    const map = parsePrioritiesJson('{"Id":111,"PriorityClass":"RealTime"}');
    expect(map.has(111)).toBe(false);
  });
});

describe("buildSetPrioritiesScript / parseSetPrioritiesOutput", () => {
  it("construye un script try/catch por PID", () => {
    const script = buildSetPrioritiesScript([{ pid: 111, priority: "BelowNormal" }]);
    expect(script).toContain("111");
    expect(script).toContain("BelowNormal");
    expect(script).toContain("try {");
  });

  it("rechaza construir un script con una prioridad no permitida", () => {
    // @ts-expect-error probamos deliberadamente un valor inválido
    expect(() => buildSetPrioritiesScript([{ pid: 1, priority: "RealTime" }])).toThrow();
  });

  it("parsea líneas OK/FAIL correctamente", () => {
    const map = parseSetPrioritiesOutput("111:OK\n222:FAIL\n");
    expect(map.get(111)).toBe(true);
    expect(map.get(222)).toBe(false);
  });
});
