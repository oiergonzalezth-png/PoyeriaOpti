/**
 * Origen del que se carga la UI de la app. Los handlers IPC solo aceptan
 * peticiones cuyo frame de origen sea exactamente este: si por cualquier
 * motivo se cargara otra página dentro de la ventana, no podría hablar con
 * el proceso principal.
 */
let trustedUrl: string | null = null;

export function setTrustedRendererUrl(url: string): void {
  trustedUrl = url;
}

function stripHashAndQuery(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

/** ¿Es `candidate` la propia UI de la app? (dev: mismo origen del servidor de Vite; prod: el index.html empaquetado). */
export function isTrustedRendererUrl(candidate: string | undefined | null, trusted: string | null = trustedUrl): boolean {
  if (!candidate || !trusted) return false;
  try {
    const a = new URL(candidate);
    const b = new URL(trusted);
    if (b.protocol === "file:") {
      return a.protocol === "file:" && stripHashAndQuery(candidate) === stripHashAndQuery(trusted);
    }
    return a.origin === b.origin;
  } catch {
    return false;
  }
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
