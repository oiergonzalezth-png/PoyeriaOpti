import { execFile } from "child_process";
import { promisify } from "util";
import {
  buildGetPrioritiesScript,
  parsePrioritiesJson,
  buildSetPrioritiesScript,
  parseSetPrioritiesOutput,
  type PsPriority,
  type PrioritySetEntry
} from "./priorityCommands";
import { resolveSystemBinary } from "../system/systemBinaries";

const execFileAsync = promisify(execFile);

async function runPowerShell(script: string): Promise<{ stdout: string; ok: boolean }> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("powershell"), ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true });
    return { stdout, ok: true };
  } catch (err: any) {
    return { stdout: err?.stdout ?? "", ok: false };
  }
}

export async function getProcessPriorities(pids: number[]): Promise<Map<number, PsPriority>> {
  if (pids.length === 0) return new Map();
  const { stdout, ok } = await runPowerShell(buildGetPrioritiesScript(pids));
  if (!ok) return new Map();
  return parsePrioritiesJson(stdout);
}

/** Devuelve qué PIDs se pudieron cambiar correctamente (los demás se ignoran, no abortan la operación). */
export async function setProcessPriorities(entries: PrioritySetEntry[]): Promise<Map<number, boolean>> {
  if (entries.length === 0) return new Map();
  const { stdout, ok } = await runPowerShell(buildSetPrioritiesScript(entries));
  if (!ok) return new Map();
  return parseSetPrioritiesOutput(stdout);
}
