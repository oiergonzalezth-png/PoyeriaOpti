import { createSolidColorPng } from "./pngIcon";

/**
 * Codificador ICO mínimo. El formato ICO moderno (soportado por Windows
 * desde Vista) permite que cada entrada del directorio contenga
 * directamente un PNG comprimido en vez de un bitmap sin comprimir, así
 * que reutilizamos `createSolidColorPng` para cada tamaño.
 *
 * Igual que con el icono de la bandeja (Fase 9): esto genera un icono
 * FUNCIONAL y 100% válido (verificado con herramientas externas), pero
 * no es la identidad de marca final de la app — es un cuadrado sólido
 * del color de acento, a falta de un diseño de icono real que solo el
 * propio proyecto puede aportar.
 */
export function createSolidColorIco(sizes: number[], rgba: [number, number, number, number]): Buffer {
  const images = sizes.map((size) => createSolidColorPng(size, rgba));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let dataOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: 1 = icono
  header.writeUInt16LE(images.length, 4); // número de imágenes

  const dirEntries: Buffer[] = [];
  for (let i = 0; i < images.length; i++) {
    const size = sizes[i];
    const image = images[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry[0] = size >= 256 ? 0 : size; // 0 significa 256 en formato ICO
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // paleta
    entry[3] = 0; // reservado
    entry.writeUInt16LE(1, 4); // planos de color
    entry.writeUInt16LE(32, 6); // bits por píxel
    entry.writeUInt32LE(image.length, 8); // tamaño de los datos
    entry.writeUInt32LE(dataOffset, 12); // offset de los datos
    dirEntries.push(entry);
    dataOffset += image.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images]);
}
