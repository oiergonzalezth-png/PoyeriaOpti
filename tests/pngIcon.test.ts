import { describe, it, expect } from "vitest";
import zlib from "zlib";
import { createSolidColorPng, createSolidColorPngDataUrl } from "../src/main/utils/pngIcon";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("createSolidColorPng", () => {
  it("empieza con la firma estándar de PNG", () => {
    const png = createSolidColorPng(16, [79, 209, 197, 255]);
    expect(Array.from(png.subarray(0, 8))).toEqual(PNG_SIGNATURE);
  });

  it("contiene los chunks IHDR, IDAT e IEND en orden", () => {
    const png = createSolidColorPng(8, [255, 0, 0, 255]);
    // El tipo de chunk son los 4 bytes después de la longitud (4 bytes), justo tras la firma.
    const ihdrType = png.subarray(12, 16).toString("ascii");
    expect(ihdrType).toBe("IHDR");

    // IEND siempre son los últimos 12 bytes (longitud=0 + "IEND" + crc), sin datos.
    const iendType = png.subarray(png.length - 8, png.length - 4).toString("ascii");
    expect(iendType).toBe("IEND");
  });

  it("el IHDR declara el ancho/alto pedidos y RGBA (color type 6)", () => {
    const size = 32;
    const png = createSolidColorPng(size, [0, 255, 0, 255]);
    const ihdrData = png.subarray(16, 16 + 13);
    expect(ihdrData.readUInt32BE(0)).toBe(size); // width
    expect(ihdrData.readUInt32BE(4)).toBe(size); // height
    expect(ihdrData[9]).toBe(6); // color type RGBA
  });

  it("el IDAT, al descomprimirse, reproduce exactamente los píxeles del color pedido", () => {
    const size = 4;
    const rgba: [number, number, number, number] = [10, 20, 30, 255];
    const png = createSolidColorPng(size, rgba);

    // Localizar el chunk IDAT: length(4) + "IDAT"(4) + data + crc(4)
    const idatLengthOffset = 8 + (4 + 4 + 13 + 4); // firma + chunk IHDR completo
    const idatLength = png.readUInt32BE(idatLengthOffset);
    const idatDataStart = idatLengthOffset + 8;
    const idatData = png.subarray(idatDataStart, idatDataStart + idatLength);

    const raw = zlib.inflateSync(idatData);
    // Cada fila: 1 byte de filtro + size*4 bytes de píxeles.
    const rowBytes = size * 4;
    for (let y = 0; y < size; y++) {
      const rowStart = y * (rowBytes + 1);
      expect(raw[rowStart]).toBe(0); // filtro "ninguno"
      for (let x = 0; x < size; x++) {
        const px = rowStart + 1 + x * 4;
        expect([raw[px], raw[px + 1], raw[px + 2], raw[px + 3]]).toEqual(rgba);
      }
    }
  });
});

describe("createSolidColorPngDataUrl", () => {
  it("devuelve una data URL válida que empieza con el prefijo esperado", () => {
    const url = createSolidColorPngDataUrl(16, [1, 2, 3, 255]);
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
  });
});
