import https from "https";
import { URL } from "url";

/** Convierte bytes transferidos + tiempo transcurrido en Mbps. Pura y testeable. */
export function computeMbps(bytes: number, elapsedMs: number): number | null {
  if (elapsedMs <= 0 || bytes <= 0) return null;
  const bits = bytes * 8;
  const seconds = elapsedMs / 1000;
  const mbps = bits / seconds / 1_000_000;
  return Math.round(mbps * 10) / 10;
}

/**
 * Abre una sola conexión de descarga hacia `url` y devuelve los bytes recibidos
 * durante `durationMs`. Se corta al llegar al timeout y reporta lo acumulado.
 * Devuelve 0 si falla (para que el agregador pueda descartar streams malos).
 */
function downloadStream(url: URL, durationMs: number): Promise<number> {
  return new Promise((resolve) => {
    let bytes = 0;
    let settled = false;
    const finish = (b: number) => { if (!settled) { settled = true; resolve(b); } };

    const req = https.get(url, (res) => {
      if ((res.statusCode ?? 0) >= 400) { res.resume(); finish(0); return; }
      res.on("data", (chunk: Buffer) => { bytes += chunk.length; });
      res.on("end", () => finish(bytes));
      res.on("error", () => finish(bytes));
    });

    req.setTimeout(durationMs, () => { req.destroy(); finish(bytes); });
    req.on("error", () => finish(bytes));
  });
}

/**
 * Descarga desde `url` usando varias conexiones paralelas durante una ventana
 * de tiempo fija. Este enfoque satura líneas de alta velocidad (>100 Mbps)
 * mucho mejor que una sola conexión grande.
 *
 * Estrategia:
 * 1. Sondeo rápido (2 s, 1 stream) para estimar la velocidad.
 * 2. Si la estimación supera 150 Mbps, escala a 8 streams paralelos durante 6 s.
 * 3. Se miden todos los bytes de todos los streams sobre la misma ventana de tiempo.
 */
export async function downloadSpeedTest(url: string, _timeoutMs = 15000): Promise<number | null> {
  const target = new URL(url.includes("?") ? url : url + "?bytes=25000000");

  // Fase 1: sondeo con 1 stream durante 2 s para calibrar
  const probeStart = Date.now();
  const probeBytes = await downloadStream(target, 2000);
  const probeElapsed = Date.now() - probeStart;
  const probeSpeed = computeMbps(probeBytes, probeElapsed) ?? 0;

  // Fase 2: si la línea es lenta (<150 Mbps) el sondeo ya es suficientemente preciso
  if (probeSpeed < 150) {
    return probeSpeed > 0 ? probeSpeed : null;
  }

  // Fase 2: línea rápida — 8 streams en paralelo durante 6 s
  const STREAMS = 8;
  const DURATION = 6000;
  const measureStart = Date.now();
  const results = await Promise.all(
    Array.from({ length: STREAMS }, () => downloadStream(target, DURATION))
  );
  const elapsed = Date.now() - measureStart;
  const totalBytes = results.reduce((a, b) => a + b, 0);

  return totalBytes > 0 ? computeMbps(totalBytes, elapsed) : null;
}

/**
 * Abre una sola conexión de subida hacia `url` enviando `payloadBytes` y
 * devuelve los bytes efectivamente enviados durante la transferencia.
 * Usa un Buffer pre-asignado para no bloquear el event loop durante el test.
 */
function uploadStream(
  target: URL,
  payload: Buffer,
  timeoutMs: number
): Promise<{ bytes: number; elapsedMs: number }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (bytes: number, elapsed: number) => {
      if (!settled) { settled = true; resolve({ bytes, elapsedMs: elapsed }); }
    };

    const req = https.request(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": payload.length
        },
        timeout: timeoutMs
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          const elapsed = Date.now() - start;
          if ((res.statusCode ?? 0) >= 400) finish(0, elapsed);
          else finish(payload.length, elapsed);
        });
        res.on("error", () => finish(0, Date.now() - start));
      }
    );

    req.on("timeout", () => { req.destroy(); finish(0, Date.now() - start); });
    req.on("error", () => finish(0, Date.now() - start));

    // Cronómetro arranca justo antes de la escritura real
    const start = Date.now();
    req.write(payload);
    req.end();
  });
}

/**
 * Sube datos a `url` usando varias conexiones paralelas.
 *
 * Estrategia:
 * 1. Calentamiento con 1 byte para establecer TLS sin contaminar la medición.
 * 2. Sondeo rápido (1 stream, 10 MB) para estimar la velocidad.
 * 3. Si supera 150 Mbps, escala a 8 streams de 25 MB en paralelo.
 *
 * El payload de cada stream se asigna una sola vez y se reutiliza entre
 * streams para no presionar el GC durante la medición.
 */
export async function uploadSpeedTest(url: string, _payloadBytes = 0, _timeoutMs = 30000): Promise<number | null> {
  const target = new URL(url);

  // Calentamiento TLS: 1 byte, sin medir
  await new Promise<void>((resolve) => {
    const warmup = Buffer.alloc(1, 0);
    const req = https.request(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "Content-Length": 1 },
        timeout: 5000
      },
      (res) => { res.resume(); res.on("end", resolve); res.on("error", resolve); }
    );
    req.on("timeout", () => { req.destroy(); resolve(); });
    req.on("error", () => resolve());
    req.write(warmup);
    req.end();
  });

  // Sondeo: 1 stream con 10 MB
  const PROBE_SIZE = 10_000_000;
  const probePayload = Buffer.alloc(PROBE_SIZE, 0);
  const probe = await uploadStream(target, probePayload, 10000);
  const probeSpeed = probe.bytes > 0 ? computeMbps(probe.bytes, probe.elapsedMs) ?? 0 : 0;

  if (probeSpeed === 0) return null;
  if (probeSpeed < 150) return probeSpeed;

  // Línea rápida: 8 streams de 25 MB en paralelo
  const STREAMS = 8;
  const STREAM_SIZE = 25_000_000;
  // Reutilizamos el mismo buffer en todos los streams (read-only durante la transferencia)
  const bigPayload = Buffer.alloc(STREAM_SIZE, 0);

  const measureStart = Date.now();
  const results = await Promise.all(
    Array.from({ length: STREAMS }, () => uploadStream(target, bigPayload, 20000))
  );
  const elapsed = Date.now() - measureStart;
  const totalBytes = results.reduce((a, b) => a + b.bytes, 0);

  return totalBytes > 0 ? computeMbps(totalBytes, elapsed) : null;
}
