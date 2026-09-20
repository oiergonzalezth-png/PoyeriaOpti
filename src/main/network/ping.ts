import { execFile } from "child_process";
import { promisify } from "util";
import net from "net";
import https from "https";
import os from "os";
import { resolveSystemBinary } from "../system/systemBinaries";

const execFileAsync = promisify(execFile);

export interface PingResult {
  latencyMs: number | null;
  jitterMs: number | null;
  packetLossPercent: number | null;
  method: "icmp" | "tcp" | "https" | null;
}

const EMPTY_RESULT: PingResult = {
  latencyMs: null,
  jitterMs: null,
  packetLossPercent: null,
  method: null
};

export function parseWindowsPingOutput(stdout: string): Omit<PingResult, "method"> {
  const lossMatch = stdout.match(/\((\d+)%\s*(?:loss|perdidos)\)/i);
  const packetLossPercent = lossMatch ? Number(lossMatch[1]) : null;

  const match =
    stdout.match(/M[ií]nimo\s*=\s*(\d+)ms,\s*M[áa]ximo\s*=\s*(\d+)ms,\s*(?:Media|Average)\s*=\s*(\d+)ms/i) ??
    stdout.match(/Minimum\s*=\s*(\d+)ms,\s*Maximum\s*=\s*(\d+)ms,\s*Average\s*=\s*(\d+)ms/i);

  if (!match) return { latencyMs: null, jitterMs: null, packetLossPercent };

  return {
    latencyMs: Number(match[3]),
    jitterMs: Number(match[2]) - Number(match[1]),
    packetLossPercent
  };
}

export function parseUnixPingOutput(stdout: string): Omit<PingResult, "method"> {
  const lossMatch = stdout.match(/(\d+(?:\.\d+)?)%\s*packet loss/i);
  const packetLossPercent = lossMatch ? Number(lossMatch[1]) : null;

  const rttMatch = stdout.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/i);
  if (!rttMatch) return { latencyMs: null, jitterMs: null, packetLossPercent };

  return {
    latencyMs: Math.round(Number(rttMatch[2])),
    jitterMs: Math.round(Number(rttMatch[4])),
    packetLossPercent
  };
}

/** Ping ICMP clásico vía proceso del sistema */
async function pingIcmp(host: string, count = 4): Promise<PingResult | null> {
  const isWindows = os.platform() === "win32";
  const args = isWindows
    ? ["-n", String(count), "-w", "1000", host]
    : ["-c", String(count), "-W", "2", host];

  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("ping"), args, {
      timeout: 10000,
      windowsHide: true
    });
    const parsed = isWindows ? parseWindowsPingOutput(stdout) : parseUnixPingOutput(stdout);
    if (parsed.latencyMs == null) return null;
    return { ...parsed, method: "icmp" };
  } catch (err: any) {
    const stdout = err?.stdout;
    if (typeof stdout === "string" && stdout.length > 0) {
      const parsed = isWindows ? parseWindowsPingOutput(stdout) : parseUnixPingOutput(stdout);
      if (parsed.latencyMs != null) return { ...parsed, method: "icmp" };
    }
    return null;
  }
}

/** Mide latencia TCP conectando al puerto 443 (HTTPS) — funciona aunque ICMP esté bloqueado */
async function pingTcp(host: string, port = 443, samples = 4): Promise<PingResult | null> {
  const latencies: number[] = [];

  for (let i = 0; i < samples; i++) {
    const latency = await new Promise<number | null>((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();

      const cleanup = (result: number | null) => {
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(2000);
      socket.connect(port, host, () => cleanup(Date.now() - start));
      socket.on("timeout", () => cleanup(null));
      socket.on("error", () => cleanup(null));
    });

    if (latency != null) latencies.push(latency);
    // Pequeña pausa entre muestras
    if (i < samples - 1) await new Promise((r) => setTimeout(r, 200));
  }

  if (latencies.length === 0) return null;

  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const loss = Math.round(((samples - latencies.length) / samples) * 100);

  return {
    latencyMs: avg,
    jitterMs: max - min,
    packetLossPercent: loss,
    method: "tcp"
  };
}

/** Último recurso: mide latencia HTTPS cronometrando la petición HEAD */
async function pingHttps(host: string, samples = 3): Promise<PingResult | null> {
  const latencies: number[] = [];

  for (let i = 0; i < samples; i++) {
    const latency = await new Promise<number | null>((resolve) => {
      const start = Date.now();
      const req = https.request(
        { hostname: host, path: "/", method: "HEAD", timeout: 3000 },
        (res) => {
          res.resume();
          resolve(Date.now() - start);
        }
      );
      req.on("timeout", () => { req.destroy(); resolve(null); });
      req.on("error", () => resolve(null));
      req.end();
    });

    if (latency != null) latencies.push(latency);
    if (i < samples - 1) await new Promise((r) => setTimeout(r, 200));
  }

  if (latencies.length === 0) return null;

  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);

  return {
    latencyMs: avg,
    jitterMs: max - min,
    packetLossPercent: Math.round(((samples - latencies.length) / samples) * 100),
    method: "https"
  };
}

/**
 * Mide la latencia intentando 3 métodos en cascada:
 * 1. ICMP (ping clásico) — puede estar bloqueado por firewall/Windows
 * 2. TCP port 443 — funciona en casi cualquier red
 * 3. HTTPS HEAD — último recurso si TCP también falla
 */
export async function runPing(host: string, count = 4): Promise<PingResult> {
  const icmp = await pingIcmp(host, count);
  if (icmp) return icmp;

  const tcp = await pingTcp(host, 443, count);
  if (tcp) return tcp;

  const httpsResult = await pingHttps(host, 3);
  if (httpsResult) return httpsResult;

  return EMPTY_RESULT;
}
