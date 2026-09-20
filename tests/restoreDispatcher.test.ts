import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { RestorePointsStore } from "../src/main/services/restorePointsStore";
import { parseDomain, registerRestoreHandler, restoreAnyPoint } from "../src/main/services/restoreDispatcher";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "leo-dispatcher-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("parseDomain", () => {
  it("extrae el dominio antes del primer ':'", () => {
    expect(parseDomain("startup:HKCU::Foo")).toBe("startup");
    expect(parseDomain("optimizer:disable-superfetch")).toBe("optimizer");
  });

  it("devuelve null si no hay ':' en el id", () => {
    expect(parseDomain("sin-dos-puntos")).toBeNull();
  });
});

describe("restoreAnyPoint", () => {
  it("devuelve NOT_FOUND si el punto no existe", async () => {
    const store = new RestorePointsStore(tmpDir);
    const result = await restoreAnyPoint("id-inexistente", store);
    expect(result.success).toBe(false);
    expect(result.error).toBe("NOT_FOUND");
  });

  it("devuelve ALREADY_RESTORED si el punto ya se restauró", async () => {
    const store = new RestorePointsStore(tmpDir);
    const point = store.add({ tweakId: "startup:HKCU::Foo", tweakName: "Foo", description: "d", previousValue: null });
    store.markRestored(point.id);

    const result = await restoreAnyPoint(point.id, store);
    expect(result.success).toBe(false);
    expect(result.error).toBe("ALREADY_RESTORED");
  });

  it("devuelve NO_HANDLER_FOR_DOMAIN si ningún módulo sabe restaurar ese dominio", async () => {
    const store = new RestorePointsStore(tmpDir);
    const point = store.add({ tweakId: "dominio-inexistente:algo", tweakName: "Algo", description: "d", previousValue: null });

    const result = await restoreAnyPoint(point.id, store);
    expect(result.success).toBe(false);
    expect(result.error).toBe("NO_HANDLER_FOR_DOMAIN");
  });

  it("delega en el handler registrado para el dominio correspondiente", async () => {
    const store = new RestorePointsStore(tmpDir);
    const point = store.add({ tweakId: "test-domain:xyz", tweakName: "XYZ", description: "d", previousValue: "abc" });

    const fakeHandler = vi.fn().mockResolvedValue({ success: true, message: "restaurado por el fake" });
    registerRestoreHandler("test-domain", fakeHandler);

    const result = await restoreAnyPoint(point.id, store);
    expect(fakeHandler).toHaveBeenCalledWith(expect.objectContaining({ id: point.id }));
    expect(result.success).toBe(true);
  });
});
