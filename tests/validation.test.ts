import { describe, it, expect } from "vitest";
import {
  isValidPid,
  isBoundedString,
  isHexString,
  parseStartupItemId,
  sanitizeSettingsPatch,
  sanitizeCreateGameProfileInput
} from "../src/main/security/validation";

describe("isValidPid", () => {
  it("acepta enteros positivos", () => {
    expect(isValidPid(1)).toBe(true);
    expect(isValidPid(4321)).toBe(true);
  });

  it("rechaza todo lo que no sea un entero positivo", () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity, "12", "1; calc", null, undefined, {}, [], 2 ** 40]) {
      expect(isValidPid(bad)).toBe(false);
    }
  });
});

describe("isBoundedString", () => {
  it("acepta cadenas normales y rechaza vacías, largas o con caracteres de control", () => {
    expect(isBoundedString("abc")).toBe(true);
    expect(isBoundedString("")).toBe(false);
    expect(isBoundedString("a".repeat(600))).toBe(false);
    expect(isBoundedString("hola\u0000mundo")).toBe(false);
    expect(isBoundedString("línea\nnueva")).toBe(false);
    expect(isBoundedString(42)).toBe(false);
  });
});

describe("isHexString", () => {
  it("solo acepta hexadecimal de longitud par", () => {
    expect(isHexString("0200000000000000")).toBe(true);
    expect(isHexString("ABcd")).toBe(true);
    expect(isHexString("abc")).toBe(false);
    expect(isHexString("0x12")).toBe(false);
    expect(isHexString("12 /f")).toBe(false);
    expect(isHexString("")).toBe(false);
    expect(isHexString(null)).toBe(false);
  });
});

describe("parseStartupItemId", () => {
  it("interpreta HKCU/HKLM con su nombre", () => {
    expect(parseStartupItemId("HKCU::Discord")).toEqual({ hive: "HKCU", name: "Discord" });
    expect(parseStartupItemId("HKLM::Mi App::v2")).toEqual({ hive: "HKLM", name: "Mi App::v2" });
  });

  it("rechaza hives desconocidos, ids vacíos y tipos incorrectos", () => {
    expect(parseStartupItemId("HKCR::Foo")).toBeNull();
    expect(parseStartupItemId("HKCU::")).toBeNull();
    expect(parseStartupItemId("sin-separador")).toBeNull();
    expect(parseStartupItemId(123)).toBeNull();
    expect(parseStartupItemId("HKCU::" + "x".repeat(300))).toBeNull();
    expect(parseStartupItemId("HKCU::mal\u0007nombre")).toBeNull();
  });
});

describe("sanitizeSettingsPatch", () => {
  it("conserva solo claves conocidas con el tipo correcto", () => {
    const result = sanitizeSettingsPatch({
      theme: "light",
      language: "en",
      startWithWindows: true,
      minimizeToTray: false,
      notificationsEnabled: true,
      __proto__: { polluted: true },
      hack: "rm -rf",
      extra: 1
    });
    expect(result).toEqual({
      theme: "light",
      language: "en",
      startWithWindows: true,
      minimizeToTray: false,
      notificationsEnabled: true
    });
  });

  it("descarta valores de tipo incorrecto", () => {
    expect(sanitizeSettingsPatch({ theme: "neon", language: "fr", startWithWindows: "yes", minimizeToTray: 1 })).toEqual({});
  });

  it("tolera entradas que no son objetos", () => {
    expect(sanitizeSettingsPatch(null)).toEqual({});
    expect(sanitizeSettingsPatch("theme")).toEqual({});
    expect(sanitizeSettingsPatch(undefined)).toEqual({});
  });
});

describe("sanitizeCreateGameProfileInput", () => {
  const valid = {
    name: "  Valorant ",
    executablePath: "C:\\Riot Games\\VALORANT\\live\\VALORANT.exe",
    priority: "HIGH",
    allowedProcesses: ["discord.exe", "  obs64.exe  ", ""],
    selectedTweakIds: ["disable-transparency"]
  };

  it("normaliza un perfil válido", () => {
    expect(sanitizeCreateGameProfileInput(valid)).toEqual({
      name: "Valorant",
      executablePath: "C:\\Riot Games\\VALORANT\\live\\VALORANT.exe",
      priority: "HIGH",
      allowedProcesses: ["discord.exe", "obs64.exe"],
      selectedTweakIds: ["disable-transparency"]
    });
  });

  it("rechaza prioridades peligrosas o desconocidas", () => {
    expect(sanitizeCreateGameProfileInput({ ...valid, priority: "REALTIME" })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, priority: "BelowNormal" })).toBeNull();
  });

  it("rechaza rutas que no son un .exe o con caracteres prohibidos", () => {
    expect(sanitizeCreateGameProfileInput({ ...valid, executablePath: "C:\\juego\\readme.txt" })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, executablePath: "C:\\a|b\\x.exe" })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, executablePath: "" })).toBeNull();
  });

  it("rechaza nombres vacíos o demasiado largos y listas mal formadas", () => {
    expect(sanitizeCreateGameProfileInput({ ...valid, name: "   " })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, name: "x".repeat(81) })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, allowedProcesses: "discord.exe" })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, allowedProcesses: [1, 2] })).toBeNull();
    expect(sanitizeCreateGameProfileInput({ ...valid, selectedTweakIds: new Array(60).fill("a") })).toBeNull();
  });

  it("rechaza entradas que no son objetos", () => {
    expect(sanitizeCreateGameProfileInput(null)).toBeNull();
    expect(sanitizeCreateGameProfileInput("perfil")).toBeNull();
  });
});
