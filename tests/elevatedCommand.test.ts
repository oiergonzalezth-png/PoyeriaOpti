import { describe, it, expect } from "vitest";
import { quoteWindowsArg, buildElevatedPowerShellCommand } from "../src/main/system/elevatedCommand";
import { resolveSystemBinary } from "../src/main/system/systemBinaries";

describe("quoteWindowsArg", () => {
  it("no toca argumentos simples", () => {
    expect(quoteWindowsArg("add")).toBe("add");
    expect(quoteWindowsArg("/v")).toBe("/v");
    expect(quoteWindowsArg("HKCU\\Software\\Run")).toBe("HKCU\\Software\\Run");
  });

  it("encierra entre comillas los argumentos con espacios", () => {
    expect(quoteWindowsArg("Mi App")).toBe('"Mi App"');
  });

  it("escapa comillas internas y barras finales", () => {
    expect(quoteWindowsArg('di "hola"')).toBe('"di \\"hola\\""');
    expect(quoteWindowsArg("C:\\Program Files\\")).toBe('"C:\\Program Files\\\\"');
  });

  it("un argumento vacío se conserva como comillas vacías", () => {
    expect(quoteWindowsArg("")).toBe('""');
  });

  it("un nombre con espacios y '/f' incluidos sigue siendo UN solo argumento", () => {
    expect(quoteWindowsArg("x /f /d 00")).toBe('"x /f /d 00"');
  });
});

describe("buildElevatedPowerShellCommand", () => {
  it("usa una única cadena de argumentos correctamente citada", () => {
    const cmd = buildElevatedPowerShellCommand("C:\\Windows\\System32\\reg.exe", [
      "add",
      "HKLM\\Software\\Run",
      "/v",
      "Mi App",
      "/f"
    ]);
    expect(cmd).toContain("-FilePath 'C:\\Windows\\System32\\reg.exe'");
    expect(cmd).toContain(`-ArgumentList 'add HKLM\\Software\\Run /v "Mi App" /f'`);
    expect(cmd).toContain("-Verb RunAs");
  });

  it("duplica las comillas simples para que no rompan la cadena de PowerShell", () => {
    const cmd = buildElevatedPowerShellCommand("C:\\Windows\\System32\\reg.exe", ["add", "O'Brien"]);
    expect(cmd).toContain("O''Brien");
    // No debe quedar ninguna comilla simple sin duplicar dentro del argumento.
    expect(cmd).not.toMatch(/O'Brien/);
  });
});

describe("resolveSystemBinary", () => {
  it("en Windows resuelve a la ruta absoluta de System32", () => {
    const env = { SystemRoot: "C:\\Windows" } as NodeJS.ProcessEnv;
    expect(resolveSystemBinary("reg", "win32", env)).toBe("C:\\Windows\\System32\\reg.exe");
    expect(resolveSystemBinary("sc", "win32", env)).toBe("C:\\Windows\\System32\\sc.exe");
    expect(resolveSystemBinary("powershell", "win32", env)).toBe(
      "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
    );
  });

  it("respeta un %SystemRoot% distinto y tiene un valor por defecto", () => {
    expect(resolveSystemBinary("ping", "win32", { SystemRoot: "D:\\WINNT" } as NodeJS.ProcessEnv)).toBe(
      "D:\\WINNT\\System32\\ping.exe"
    );
    expect(resolveSystemBinary("reg", "win32", {} as NodeJS.ProcessEnv)).toBe("C:\\Windows\\System32\\reg.exe");
  });

  it("fuera de Windows devuelve el nombre sin más", () => {
    expect(resolveSystemBinary("ping", "linux")).toBe("ping");
  });
});
