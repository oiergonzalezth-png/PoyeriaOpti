import si from "systeminformation";
import type { ProcessInfo } from "@shared/types/system";

/**
 * Whitelist de procesos críticos de Windows que NUNCA deben poder finalizarse
 * desde la app, sea cual sea el criterio de "seguro" que se use en el futuro.
 * Los nombres se comparan en minúsculas.
 */
export const CRITICAL_PROCESS_WHITELIST = new Set(
  [
    "system",
    "system idle process",
    "registry",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "winlogon.exe",
    "services.exe",
    "lsass.exe",
    "svchost.exe",
    "explorer.exe",
    "dwm.exe",
    "fontdrvhost.exe",
    "sihost.exe",
    "ctfmon.exe",
    "taskhostw.exe",
    "userinit.exe",
    "spoolsv.exe",
    "wudfhost.exe",
    "audiodg.exe"
  ].map((n) => n.toLowerCase())
);

export function isCriticalProcess(name: string): boolean {
  return CRITICAL_PROCESS_WHITELIST.has(name.trim().toLowerCase());
}

export async function getProcessList(): Promise<ProcessInfo[]> {
  const data = await si.processes();

  return data.list.map((p) => ({
    pid: p.pid,
    name: p.name || `pid-${p.pid}`,
    cpuPercent: Math.round((p.cpu || 0) * 10) / 10,
    memoryMb: Math.round((p.memRss || 0) / 1024),
    status: p.state || "unknown",
    critical: isCriticalProcess(p.name || "")
  }));
}
