import { describe, it, expect } from "vitest";
import { selectProcessesToDeprioritize, findGameProcess, executableBaseName } from "../src/main/gaming/processSelection";
import type { ProcessInfo } from "../src/shared/types/system";

function proc(overrides: Partial<ProcessInfo>): ProcessInfo {
  return {
    pid: 1,
    name: "test.exe",
    cpuPercent: 0,
    memoryMb: 100,
    status: "running",
    critical: false,
    ...overrides
  };
}

describe("executableBaseName", () => {
  it("extrae el nombre de archivo de una ruta Windows", () => {
    expect(executableBaseName("C:\\Games\\Valorant\\VALORANT.exe")).toBe("VALORANT.exe");
  });

  it("extrae el nombre de archivo de una ruta con /", () => {
    expect(executableBaseName("C:/Games/CS2/cs2.exe")).toBe("cs2.exe");
  });

  it("devuelve la ruta completa si no hay separadores", () => {
    expect(executableBaseName("juego.exe")).toBe("juego.exe");
  });
});

describe("findGameProcess", () => {
  it("encuentra el proceso por nombre, sin distinguir mayúsculas", () => {
    const processes = [proc({ pid: 5, name: "VALORANT.exe" })];
    expect(findGameProcess(processes, "valorant.exe")?.pid).toBe(5);
  });

  it("devuelve null si no hay nombre de juego o no está corriendo", () => {
    const processes = [proc({ pid: 5, name: "chrome.exe" })];
    expect(findGameProcess(processes, null)).toBeNull();
    expect(findGameProcess(processes, "valorant.exe")).toBeNull();
  });
});

describe("selectProcessesToDeprioritize", () => {
  it("excluye procesos críticos del sistema", () => {
    const processes = [proc({ pid: 1, name: "explorer.exe", critical: true, memoryMb: 500 }), proc({ pid: 2, name: "chrome.exe", memoryMb: 300 })];
    const result = selectProcessesToDeprioritize(processes, { gameProcessName: null, allowedProcesses: [] });
    expect(result.find((p) => p.pid === 1)).toBeUndefined();
    expect(result.find((p) => p.pid === 2)).toBeDefined();
  });

  it("excluye el propio proceso del juego", () => {
    const processes = [proc({ pid: 3, name: "valorant.exe", memoryMb: 900 }), proc({ pid: 4, name: "chrome.exe", memoryMb: 300 })];
    const result = selectProcessesToDeprioritize(processes, { gameProcessName: "VALORANT.exe", allowedProcesses: [] });
    expect(result.find((p) => p.pid === 3)).toBeUndefined();
  });

  it("excluye los procesos permitidos explícitamente por el perfil", () => {
    const processes = [proc({ pid: 6, name: "discord.exe", memoryMb: 400 }), proc({ pid: 7, name: "chrome.exe", memoryMb: 300 })];
    const result = selectProcessesToDeprioritize(processes, { gameProcessName: null, allowedProcesses: ["discord.exe"] });
    expect(result.find((p) => p.pid === 6)).toBeUndefined();
    expect(result.find((p) => p.pid === 7)).toBeDefined();
  });

  it("ordena por RAM descendente y respeta el límite", () => {
    const processes = [
      proc({ pid: 1, name: "a.exe", memoryMb: 100 }),
      proc({ pid: 2, name: "b.exe", memoryMb: 900 }),
      proc({ pid: 3, name: "c.exe", memoryMb: 500 })
    ];
    const result = selectProcessesToDeprioritize(processes, { gameProcessName: null, allowedProcesses: [], limit: 2 });
    expect(result.map((p) => p.pid)).toEqual([2, 3]);
  });
});
