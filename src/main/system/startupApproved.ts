/**
 * Windows usa la clave de registro
 * `...\Explorer\StartupApproved\Run` (y `\Run32`) para marcar como
 * deshabilitada una entrada de `...\CurrentVersion\Run` SIN eliminarla de
 * ahí — que es exactamente el mecanismo que usa el propio Administrador de
 * tareas de Windows en la pestaña "Inicio". Por eso lo replicamos aquí en
 * vez de borrar/mover la entrada original (regla #10 del proyecto: "No
 * eliminar entradas").
 *
 * Formato del valor REG_BINARY (documentado extensamente en literatura de
 * forense de Windows, aunque no es una API pública de Microsoft):
 *   byte 0       : 0x02 = habilitado, 0x03 = deshabilitado
 *   bytes 1-3    : reservados, siempre 0x00
 *   bytes 4-11   : FILETIME (little-endian) del momento del cambio
 *
 * IMPORTANTE: esta lógica de codificación está verificada con tests
 * unitarios (round-trip), pero el efecto real sobre Windows (que el
 * propio Explorer/Task Manager respete este valor) NO se ha podido
 * verificar en este entorno porque no hay una máquina Windows disponible
 * aquí. Se recomienda validarlo en Windows real antes de confiar en él
 * en producción.
 */

const FILETIME_EPOCH_DIFF_MS = 11644473600000; // 1601-01-01 -> 1970-01-01

export function dateToFiletimeBuffer(date: Date): Buffer {
  const ms = date.getTime() + FILETIME_EPOCH_DIFF_MS;
  // FILETIME = intervalos de 100ns. Usamos BigInt para no perder precisión.
  const filetime = BigInt(ms) * 10000n;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(filetime, 0);
  return buf;
}

export function buildStartupApprovedValue(enabled: boolean, at: Date = new Date()): Buffer {
  const buf = Buffer.alloc(12, 0);
  buf.writeUInt8(enabled ? 0x02 : 0x03, 0);
  dateToFiletimeBuffer(at).copy(buf, 4);
  return buf;
}

/**
 * Interpreta un valor StartupApproved existente. Devuelve `null` si el
 * buffer no tiene el tamaño esperado o un byte de estado desconocido —
 * nunca se asume un estado por defecto a partir de datos que no
 * entendemos.
 */
export function parseStartupApprovedValue(buf: Buffer): boolean | null {
  if (buf.length < 1) return null;
  if (buf[0] === 0x02) return true;
  if (buf[0] === 0x03) return false;
  return null;
}

export function bufferToRegHex(buf: Buffer): string {
  return buf.toString("hex");
}

export function regHexToBuffer(hex: string): Buffer {
  const clean = hex.replace(/\s+/g, "");
  return Buffer.from(clean, "hex");
}
