import { describe, it, expect } from "vitest";
import { isTrustedRendererUrl, isSafeExternalUrl } from "../src/main/security/trustedOrigin";

describe("isTrustedRendererUrl", () => {
  const devTrusted = "http://localhost:5173/";
  const prodTrusted = "file:///C:/Program%20Files/Low-End%20Optimizer/resources/app.asar/dist-renderer/index.html";

  it("en desarrollo acepta el mismo origen del servidor de Vite", () => {
    expect(isTrustedRendererUrl("http://localhost:5173/", devTrusted)).toBe(true);
    expect(isTrustedRendererUrl("http://localhost:5173/algo?x=1#y", devTrusted)).toBe(true);
  });

  it("en desarrollo rechaza otros puertos, hosts y esquemas", () => {
    expect(isTrustedRendererUrl("http://localhost:9999/", devTrusted)).toBe(false);
    expect(isTrustedRendererUrl("http://evil.example/", devTrusted)).toBe(false);
    expect(isTrustedRendererUrl("https://localhost:5173/", devTrusted)).toBe(false);
  });

  it("en producción solo acepta exactamente el index.html empaquetado", () => {
    expect(isTrustedRendererUrl(prodTrusted, prodTrusted)).toBe(true);
    expect(isTrustedRendererUrl(prodTrusted + "#/dashboard", prodTrusted)).toBe(true);
    expect(isTrustedRendererUrl("file:///C:/Users/x/Downloads/malo.html", prodTrusted)).toBe(false);
    expect(isTrustedRendererUrl("https://example.com/", prodTrusted)).toBe(false);
  });

  it("rechaza vacíos y URLs inválidas", () => {
    expect(isTrustedRendererUrl("", devTrusted)).toBe(false);
    expect(isTrustedRendererUrl(undefined, devTrusted)).toBe(false);
    expect(isTrustedRendererUrl("no es una url", devTrusted)).toBe(false);
    expect(isTrustedRendererUrl("http://localhost:5173/", null)).toBe(false);
  });
});

describe("isSafeExternalUrl", () => {
  it("solo permite https", () => {
    expect(isSafeExternalUrl("https://example.com/ayuda")).toBe(true);
    expect(isSafeExternalUrl("http://example.com")).toBe(false);
    expect(isSafeExternalUrl("file:///C:/Windows/System32/calc.exe")).toBe(false);
    expect(isSafeExternalUrl("ms-msdt:/id PCWDiagnostic")).toBe(false);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("basura")).toBe(false);
  });
});
