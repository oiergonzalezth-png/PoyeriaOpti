import { describe, it, expect } from "vitest";
import { isCriticalProcess } from "../src/main/system/processes";

describe("isCriticalProcess", () => {
  it("detecta procesos críticos del sistema en minúsculas/mayúsculas", () => {
    expect(isCriticalProcess("explorer.exe")).toBe(true);
    expect(isCriticalProcess("EXPLORER.EXE")).toBe(true);
    expect(isCriticalProcess("winlogon.exe")).toBe(true);
  });

  it("no marca como críticos procesos de usuario normales", () => {
    expect(isCriticalProcess("chrome.exe")).toBe(false);
    expect(isCriticalProcess("discord.exe")).toBe(false);
    expect(isCriticalProcess("valorant.exe")).toBe(false);
  });

  it("ignora espacios accidentales", () => {
    expect(isCriticalProcess("  svchost.exe  ")).toBe(true);
  });
});
