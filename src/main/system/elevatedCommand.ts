import { execFile } from "child_process";
import { promisify } from "util";
import { resolveSystemBinary, type SystemBinary } from "./systemBinaries";

const execFileAsync = promisify(execFile);

/**
 * Cita un argumento siguiendo las reglas de `CommandLineToArgvW` de Windows,
 * para que un argumento con espacios o comillas (p. ej. un programa de inicio
 * llamado `Mi App`) llegue al programa como UN solo argumento y nunca pueda
 * "colar" argumentos adicionales.
 */
export function quoteWindowsArg(arg: string): string {
  if (arg.length > 0 && !/[\s"]/.test(arg)) return arg;

  let out = '"';
  let backslashes = 0;
  for (const ch of arg) {
    if (ch === "\\") {
      backslashes++;
    } else if (ch === '"') {
      out += "\\".repeat(backslashes * 2 + 1) + '"';
      backslashes = 0;
    } else {
      out += "\\".repeat(backslashes) + ch;
      backslashes = 0;
    }
  }
  out += "\\".repeat(backslashes * 2) + '"';
  return out;
}

/** Escapa un texto para meterlo dentro de una cadena PowerShell entre comillas simples. */
function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Construye el comando de PowerShell que lanza `filePath` con UAC. Pura y testeable. */
export function buildElevatedPowerShellCommand(filePath: string, args: string[]): string {
  const argumentLine = args.map(quoteWindowsArg).join(" ");
  const argumentPart = argumentLine.length > 0 ? ` -ArgumentList ${psSingleQuote(argumentLine)}` : "";
  return (
    `$p = Start-Process -FilePath ${psSingleQuote(filePath)}${argumentPart} -Verb RunAs -Wait -PassThru -WindowStyle Hidden; ` +
    `Write-Output $p.ExitCode`
  );
}

/**
 * Ejecuta un comando de Windows (reg.exe, sc.exe, powercfg.exe) con o sin
 * elevación. Si `elevated` es true, se solicita elevación SOLO para este
 * comando concreto vía UAC (usando PowerShell `Start-Process -Verb RunAs`),
 * en vez de relanzar toda la aplicación como administrador.
 *
 * Las herramientas se resuelven siempre a su ruta absoluta en System32
 * (ver `systemBinaries.ts`).
 *
 * NOTA: el camino "elevated" no se puede probar sin Windows/UAC; conviene
 * validarlo en una máquina Windows real.
 */
export async function runElevatedCommand(
  file: SystemBinary,
  args: string[],
  elevated: boolean
): Promise<{ stdout: string; exitCode: number }> {
  const filePath = resolveSystemBinary(file);

  if (!elevated) {
    try {
      const { stdout } = await execFileAsync(filePath, args, { windowsHide: true });
      return { stdout, exitCode: 0 };
    } catch (err: any) {
      return { stdout: err?.stdout ?? "", exitCode: typeof err?.code === "number" ? err.code : 1 };
    }
  }

  const psCommand = buildElevatedPowerShellCommand(filePath, args);

  try {
    const { stdout } = await execFileAsync(
      resolveSystemBinary("powershell"),
      ["-NoProfile", "-NonInteractive", "-Command", psCommand],
      { windowsHide: true }
    );
    const exitCode = parseInt(stdout.trim(), 10);
    return { stdout, exitCode: Number.isNaN(exitCode) ? 1 : exitCode };
  } catch (err: any) {
    // El usuario canceló el UAC, o powershell no está disponible.
    return { stdout: err?.stdout ?? "", exitCode: typeof err?.code === "number" ? err.code : 1 };
  }
}

/** Atajo específico para `reg.exe`. */
export async function runRegCommand(args: string[], elevated: boolean): Promise<{ stdout: string; exitCode: number }> {
  return runElevatedCommand("reg", args, elevated);
}
