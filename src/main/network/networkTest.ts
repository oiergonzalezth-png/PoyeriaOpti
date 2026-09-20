import type { NetworkTestResult } from "@shared/types/system";
import { runPing } from "./ping";
import { getDnsServers } from "./dns";
import { getNetworkAdapters } from "./adapters";
import { downloadSpeedTest, uploadSpeedTest } from "./speedTest";

const PING_HOST = "1.1.1.1";
const DOWNLOAD_TEST_URL = "https://speed.cloudflare.com/__down";
const UPLOAD_TEST_URL = "https://speed.cloudflare.com/__up";

export async function runNetworkTest(): Promise<NetworkTestResult> {
  const errors: string[] = [];

  const [pingResult, adapters, downloadMbps, uploadMbps] = await Promise.all([
    runPing(PING_HOST).catch(() => ({
      latencyMs: null,
      jitterMs: null,
      packetLossPercent: null,
      method: null as null
    })),
    getNetworkAdapters().catch(() => {
      errors.push("No se pudo leer la información de los adaptadores de red.");
      return [];
    }),
    downloadSpeedTest(DOWNLOAD_TEST_URL).catch(() => null),
    uploadSpeedTest(UPLOAD_TEST_URL).catch(() => null)
  ]);

  // Solo añadir error si ningún método de ping funcionó
  if (pingResult.latencyMs == null) {
    errors.push(`Sin respuesta de ${PING_HOST} por ICMP, TCP ni HTTPS. Comprueba la conexión.`);
  }

  if (downloadMbps == null) {
    errors.push("No se pudo medir la velocidad de descarga (sin conexión o servidor no disponible).");
  }
  if (uploadMbps == null) {
    errors.push("No se pudo medir la velocidad de subida.");
  }

  const dnsServers = getDnsServers();

  return {
    timestamp: new Date().toISOString(),
    pingHost: PING_HOST,
    latencyMs: pingResult.latencyMs,
    jitterMs: pingResult.jitterMs,
    packetLossPercent: pingResult.packetLossPercent,
    pingMethod: pingResult.method,
    downloadMbps,
    uploadMbps,
    dnsServers,
    adapters,
    errors
  };
}
