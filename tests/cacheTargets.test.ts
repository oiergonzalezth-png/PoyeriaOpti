import { describe, it, expect } from "vitest";
import { CACHE_TARGETS, isKnownCacheTargetId } from "../src/main/cache/cacheTargets";
import { scanCacheTargets, clearCacheTargetById, flushDnsCache } from "../src/main/cache/cacheScanner";

describe("cache targets catalog", () => {
  it("tiene entradas para las 3 categorías (red, apps, windows) con id único", () => {
    const ids = new Set(CACHE_TARGETS.map((t) => t.id));
    expect(ids.size).toBe(CACHE_TARGETS.length);

    const scopes = new Set(CACHE_TARGETS.map((t) => t.scope));
    expect(scopes.has("network")).toBe(true);
    expect(scopes.has("apps")).toBe(true);
    expect(scopes.has("windows")).toBe(true);
  });

  it("incluye discord, epic games, riot client y ea entre las apps detectables", () => {
    const appIds = CACHE_TARGETS.filter((t) => t.scope === "apps").map((t) => t.id);
    expect(appIds).toEqual(expect.arrayContaining(["discord", "epic-games", "riot-client", "ea-app"]));
  });

  it("cada target de apps solo apunta a subcarpetas de caché, nunca a la raíz de datos de usuario", () => {
    for (const target of CACHE_TARGETS.filter((t) => t.scope === "apps")) {
      for (const folder of target.folders()) {
        expect(/cache/i.test(folder)).toBe(true);
      }
    }
  });

  it("isKnownCacheTargetId rechaza ids desconocidos y valores no-string", () => {
    expect(isKnownCacheTargetId("discord")).toBe(true);
    expect(isKnownCacheTargetId("no-existe")).toBe(false);
    expect(isKnownCacheTargetId(123)).toBe(false);
    expect(isKnownCacheTargetId(undefined)).toBe(false);
  });
});

describe("cache scanner", () => {
  it("escanea todos los targets sin lanzar, incluso fuera de Windows", async () => {
    const results = await scanCacheTargets();
    expect(results.length).toBe(CACHE_TARGETS.length);
    for (const r of results) {
      expect(typeof r.detected).toBe("boolean");
      expect(r.sizeBytes === null || typeof r.sizeBytes === "number").toBe(true);
    }
  });

  it("limpiar un id desconocido devuelve error claro, sin fingir éxito", async () => {
    const result = await clearCacheTargetById("no-existe");
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNKNOWN_CACHE_TARGET");
  });

  it("limpiar una caché real en una plataforma no soportada nunca finge éxito", async () => {
    const result = await clearCacheTargetById("discord");
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNSUPPORTED_PLATFORM");
  });

  it("vaciar la caché DNS en una plataforma no soportada nunca finge éxito", async () => {
    const result = await flushDnsCache();
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNSUPPORTED_PLATFORM");
  });
});
