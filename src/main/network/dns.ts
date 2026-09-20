import dns from "dns";

/**
 * Devuelve los servidores DNS configurados en el sistema. `dns.getServers()`
 * es una API nativa de Node/libuv que lee la configuración real del sistema
 * operativo (en Windows, vía las APIs de resolución de nombres del propio
 * Windows) — no hace falta invocar `ipconfig` ni parsear texto para esto.
 */
export function getDnsServers(): string[] {
  try {
    return dns.getServers();
  } catch {
    return [];
  }
}
