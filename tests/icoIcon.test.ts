import { describe, it, expect } from "vitest";
import { createSolidColorIco } from "../src/main/utils/icoIcon";

describe("createSolidColorIco", () => {
  it("empieza con la cabecera ICO estándar (reservado=0, tipo=1)", () => {
    const ico = createSolidColorIco([16, 32], [79, 209, 197, 255]);
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
  });

  it("declara el número correcto de imágenes", () => {
    const ico = createSolidColorIco([16, 32, 48, 256], [1, 2, 3, 255]);
    expect(ico.readUInt16LE(4)).toBe(4);
  });

  it("cada entrada del directorio apunta a datos PNG válidos (firma PNG en el offset declarado)", () => {
    const sizes = [16, 32];
    const ico = createSolidColorIco(sizes, [10, 20, 30, 255]);
    const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    for (let i = 0; i < sizes.length; i++) {
      const entryOffset = 6 + i * 16;
      const dataOffset = ico.readUInt32LE(entryOffset + 12);
      const signatureBytes = Array.from(ico.subarray(dataOffset, dataOffset + 8));
      expect(signatureBytes).toEqual(PNG_SIGNATURE);
    }
  });

  it("codifica el tamaño 256 como 0 (convención del formato ICO)", () => {
    const ico = createSolidColorIco([256], [0, 0, 0, 255]);
    expect(ico[6]).toBe(0); // width byte de la única entrada
    expect(ico[7]).toBe(0); // height byte
  });
});
