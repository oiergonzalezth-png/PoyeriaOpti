import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { RestorePointsStore } from "../src/main/services/restorePointsStore";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "leo-restore-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("RestorePointsStore", () => {
  it("empieza vacío si el fichero no existe todavía", () => {
    const store = new RestorePointsStore(tmpDir);
    expect(store.list()).toEqual([]);
  });

  it("guarda y recupera puntos de restauración, más recientes primero", () => {
    const store = new RestorePointsStore(tmpDir);
    store.add({ tweakId: "startup:HKCU::Foo", tweakName: "Foo", description: "desc Foo", previousValue: null });
    store.add({ tweakId: "startup:HKCU::Bar", tweakName: "Bar", description: "desc Bar", previousValue: "0200000000000000" });

    const list = store.list();
    expect(list).toHaveLength(2);
    expect(list[0].tweakName).toBe("Bar"); // el último añadido va primero
  });

  it("getLatestUnrestored devuelve solo el más reciente no restaurado de ese tweakId", () => {
    const store = new RestorePointsStore(tmpDir);
    const first = store.add({ tweakId: "startup:HKCU::Foo", tweakName: "Foo", description: "desc", previousValue: null });
    store.add({ tweakId: "startup:HKCU::Foo", tweakName: "Foo", description: "desc", previousValue: "aa" });

    store.markRestored(first.id);
    const latest = store.getLatestUnrestored("startup:HKCU::Foo");
    expect(latest?.previousValue).toBe("aa");
  });

  it("persiste entre instancias (mismo directorio)", () => {
    const store1 = new RestorePointsStore(tmpDir);
    store1.add({ tweakId: "startup:HKCU::Persist", tweakName: "Persist", description: "desc", previousValue: null });

    const store2 = new RestorePointsStore(tmpDir);
    expect(store2.list()).toHaveLength(1);
  });
});
