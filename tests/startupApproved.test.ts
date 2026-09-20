import { describe, it, expect } from "vitest";
import {
  buildStartupApprovedValue,
  parseStartupApprovedValue,
  bufferToRegHex,
  regHexToBuffer
} from "../src/main/system/startupApproved";

describe("StartupApproved value encode/decode", () => {
  it("codifica habilitado como byte 0x02 y se decodifica como true", () => {
    const buf = buildStartupApprovedValue(true);
    expect(buf.length).toBe(12);
    expect(buf[0]).toBe(0x02);
    expect(parseStartupApprovedValue(buf)).toBe(true);
  });

  it("codifica deshabilitado como byte 0x03 y se decodifica como false", () => {
    const buf = buildStartupApprovedValue(false);
    expect(buf[0]).toBe(0x03);
    expect(parseStartupApprovedValue(buf)).toBe(false);
  });

  it("sobrevive un round-trip a través de hexadecimal (como lo devuelve reg.exe)", () => {
    const original = buildStartupApprovedValue(false, new Date("2026-01-01T00:00:00Z"));
    const hex = bufferToRegHex(original);
    const restored = regHexToBuffer(hex);
    expect(restored.equals(original)).toBe(true);
    expect(parseStartupApprovedValue(restored)).toBe(false);
  });

  it("devuelve null ante un byte de estado desconocido, en vez de asumir un valor", () => {
    const buf = Buffer.alloc(12, 0);
    buf.writeUInt8(0x09, 0); // valor no reconocido
    expect(parseStartupApprovedValue(buf)).toBeNull();
  });

  it("devuelve null ante un buffer vacío", () => {
    expect(parseStartupApprovedValue(Buffer.alloc(0))).toBeNull();
  });
});
