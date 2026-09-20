import { describe, it, expect } from "vitest";
import { normalizeAdapterType } from "../src/main/network/adapters";

describe("normalizeAdapterType", () => {
  it("reconoce wired/wireless/virtual", () => {
    expect(normalizeAdapterType("wired")).toBe("wired");
    expect(normalizeAdapterType("wireless")).toBe("wireless");
    expect(normalizeAdapterType("virtual")).toBe("virtual");
  });

  it("devuelve null ante valores desconocidos o ausentes, sin adivinar", () => {
    expect(normalizeAdapterType(undefined)).toBeNull();
    expect(normalizeAdapterType("")).toBeNull();
    expect(normalizeAdapterType("bluetooth")).toBeNull();
  });
});
