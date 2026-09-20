import { describe, it, expect } from "vitest";
import { normalizeDiskType } from "../src/main/system/hardwareInfo";

describe("normalizeDiskType", () => {
  it("reconoce SSD y NVMe en distintas variantes", () => {
    expect(normalizeDiskType("SSD")).toBe("SSD");
    expect(normalizeDiskType("ssd")).toBe("SSD");
    expect(normalizeDiskType("NVMe")).toBe("NVMe");
    expect(normalizeDiskType("nvme ssd")).toBe("NVMe");
  });

  it("reconoce HDD", () => {
    expect(normalizeDiskType("HD")).toBe("HDD");
    expect(normalizeDiskType("hdd")).toBe("HDD");
  });

  it("devuelve null si no hay dato o es ambiguo, en vez de adivinar", () => {
    expect(normalizeDiskType("")).toBeNull();
    expect(normalizeDiskType(undefined)).toBeNull();
    expect(normalizeDiskType(null)).toBeNull();
    expect(normalizeDiskType("unknown-thing")).toBeNull();
  });
});
