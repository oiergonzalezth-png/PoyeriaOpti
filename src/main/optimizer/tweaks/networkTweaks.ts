import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import type { OperationResult } from "@shared/types/system";
import type { Tweak } from "../types";
import { createRegistryToggleTweak } from "../registryToggleTweak";
import { logOperation } from "../../services/logger";
import { getRestorePointsStore } from "../../services/restorePointsStoreInstance";
import { runRegCommand } from "../../system/elevatedCommand";
import { resolveSystemBinary } from "../../system/systemBinaries";

const execFileAsync = promisify(execFile);

// ─── Tweaks simples de una sola clave de registro ───────────────────────────

export const disableNetworkThrottlingTweak: Tweak = createRegistryToggleTweak({
  id: "disable-network-throttling-index",
  name: "Disable network throttling for foreground apps",
  description:
    'Desactiva el "Network Throttling Index" del Multimedia Class Scheduler Service (MMCSS) ' +
    "(HKLM\\...\\Multimedia\\SystemProfile\\NetworkThrottlingIndex). Por defecto Windows limita el " +
    "tráfico de red no multimedia a ~10 paquetes/ms mientras hay audio/vídeo reproduciéndose, para " +
    "evitar cortes de sonido. En equipos modernos esa protección ya no hace falta y puede introducir " +
    "picos de latencia en juegos online mientras hay otro proceso multimedia activo (Discord, streaming, etc.).",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
  valueName: "NetworkThrottlingIndex",
  valueType: "REG_DWORD",
  enabledValue: "0xffffffff", // desactiva el límite por completo
  disabledValue: "0xa" // valor por defecto de Windows (10)
});

export const reduceSystemResponsivenessTweak: Tweak = createRegistryToggleTweak({
  id: "reduce-system-responsiveness",
  name: "Reduce reserved CPU for background tasks (SystemResponsiveness)",
  description:
    'Reduce a 0 el "SystemResponsiveness" del Multimedia Class Scheduler Service ' +
    "(HKLM\\...\\Multimedia\\SystemProfile\\SystemResponsiveness). Por defecto Windows reserva un 20% " +
    "de la CPU para tareas de baja prioridad mientras hay un proceso multimedia en primer plano (un " +
    "juego cuenta como tal). Ponerlo a 0 deja esa CPU disponible para el juego, a costa de que tareas " +
    "en segundo plano puedan competir un poco más por recursos. Se suele aplicar junto al tweak de " +
    "Network Throttling, ya que viven en la misma clave.",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
  valueName: "SystemResponsiveness",
  valueType: "REG_DWORD",
  enabledValue: "0x0",
  disabledValue: "0x14" // valor por defecto de Windows (20)
});

export const disableDeliveryOptimizationP2PTweak: Tweak = createRegistryToggleTweak({
  id: "disable-delivery-optimization-p2p",
  name: "Disable Windows Update peer-to-peer sharing",
  description:
    'Pone "Delivery Optimization" en modo solo-HTTP (HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\' +
    "DeliveryOptimization\\DODownloadMode = 0). Por defecto Windows puede subir y descargar " +
    "actualizaciones desde/hacia otros PCs de tu red local e internet en segundo plano, lo que " +
    "consume ancho de banda de subida sin avisar — justo cuando estás jugando online. Con este tweak, " +
    "las actualizaciones se siguen descargando con normalidad, pero directamente desde los servidores " +
    "de Microsoft, sin compartir tu conexión con otros equipos.",
  category: "Red",
  risk: "LOW",
  impact: "LOW",
  hive: "HKLM",
  keyPath: "SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization",
  valueName: "DODownloadMode",
  valueType: "REG_DWORD",
  enabledValue: "0x0",
  disabledValue: "0x1" // "LAN" (modo por defecto de Windows 10/11)
});

// ─── Nagle's Algorithm / ACK diferido (multi-interfaz) ──────────────────────
//
// A diferencia de los tweaks anteriores, TcpAckFrequency y TCPNoDelay no
// viven en una única clave global, sino en una subclave por cada adaptador
// de red instalado (HKLM\SYSTEM\...\Tcpip\Parameters\Interfaces\{GUID}).
// Por eso este tweak no usa `createRegistryToggleTweak` y en vez de eso
// enumera todas las interfaces y aplica/revierte el cambio en cada una.

const NAGLE_TWEAK_ID = "disable-nagle-algorithm";
const NAGLE_TWEAK_NAME = "Disable Nagle's Algorithm and delayed ACK";
const INTERFACES_KEY = "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces";
const INTERFACES_KEY_PREFIX = "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\";

interface NagleInterfaceSnapshot {
  path: string;
  tcpAckFrequency: string | null;
  tcpNoDelay: string | null;
}

async function listInterfaceKeys(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("reg"), ["query", INTERFACES_KEY], { windowsHide: true });
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.toUpperCase().startsWith(INTERFACES_KEY_PREFIX));
  } catch {
    return [];
  }
}

async function readRegDword(path: string, valueName: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("reg"), ["query", path, "/v", valueName], { windowsHide: true });
    const match = stdout.match(/REG_DWORD\s+(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null; // el valor no existe en esta interfaz
  }
}

async function writeRegDword(path: string, valueName: string, value: string): Promise<boolean> {
  const { exitCode } = await runRegCommand(["add", path, "/v", valueName, "/t", "REG_DWORD", "/d", value, "/f"], true);
  return exitCode === 0;
}

async function deleteRegValueIfPresent(path: string, valueName: string): Promise<boolean> {
  const current = await readRegDword(path, valueName);
  if (current === null) return true; // ya no estaba, nada que borrar
  const { exitCode } = await runRegCommand(["delete", path, "/v", valueName, "/f"], true);
  return exitCode === 0;
}

export const disableNagleAlgorithmTweak: Tweak = {
  id: NAGLE_TWEAK_ID,
  name: NAGLE_TWEAK_NAME,
  description:
    "Desactiva el algoritmo de Nagle y el ACK diferido (TCPNoDelay=1, TcpAckFrequency=1) en TODAS las " +
    "interfaces de red detectadas (HKLM\\SYSTEM\\...\\Tcpip\\Parameters\\Interfaces\\{GUID}). Por defecto, " +
    "Windows agrupa paquetes TCP pequeños y retrasa el envío de confirmaciones (ACK) para ser más " +
    "eficiente con conexiones lentas; en juegos competitivos por TCP y en escritorio remoto, esto añade " +
    "unos milisegundos de retardo perceptible. Solo afecta a tráfico TCP (no a UDP, que usan la mayoría " +
    "de shooters online) y puede reducir ligeramente el rendimiento en transferencias grandes de archivos.",
  category: "Red",
  risk: "MEDIUM",
  impact: "LOW",
  requiresAdmin: true,

  async check(): Promise<boolean | null> {
    if (os.platform() !== "win32") return null;
    const interfaces = await listInterfaceKeys();
    if (interfaces.length === 0) return null;

    let allEnabled = true;
    let anyEnabled = false;
    for (const ifacePath of interfaces) {
      const tcpNoDelay = await readRegDword(ifacePath, "TCPNoDelay");
      if (tcpNoDelay === "0x1") {
        anyEnabled = true;
      } else {
        allEnabled = false;
      }
    }

    if (allEnabled) return true;
    if (!anyEnabled) return false;
    return null; // aplicado solo parcialmente (p. ej. se añadió un adaptador nuevo después)
  },

  async apply(): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    const interfaces = await listInterfaceKeys();
    if (interfaces.length === 0) {
      return { success: false, message: "No se encontraron interfaces de red en el registro.", error: "NO_INTERFACES_FOUND" };
    }

    const previousValue: NagleInterfaceSnapshot[] = [];
    for (const ifacePath of interfaces) {
      previousValue.push({
        path: ifacePath,
        tcpAckFrequency: await readRegDword(ifacePath, "TcpAckFrequency"),
        tcpNoDelay: await readRegDword(ifacePath, "TCPNoDelay")
      });
    }

    getRestorePointsStore().add({
      tweakId: `optimizer:${NAGLE_TWEAK_ID}`,
      tweakName: NAGLE_TWEAK_NAME,
      description: `Se desactivó Nagle/ACK diferido en ${interfaces.length} interfaz(ces) de red.`,
      previousValue
    });

    let allOk = true;
    for (const ifacePath of interfaces) {
      const ok1 = await writeRegDword(ifacePath, "TcpAckFrequency", "1");
      const ok2 = await writeRegDword(ifacePath, "TCPNoDelay", "1");
      if (!ok1 || !ok2) allOk = false;
    }

    if (!allOk) {
      logOperation(NAGLE_TWEAK_NAME, "FAILURE", "No se pudo escribir el valor en todas las interfaces de red.");
      return { success: false, message: "No se pudo aplicar el ajuste en todas las interfaces de red.", error: "REG_COMMAND_FAILED" };
    }

    logOperation(NAGLE_TWEAK_NAME, "SUCCESS");
    return {
      success: true,
      message: `Nagle's Algorithm y ACK diferido desactivados en ${interfaces.length} interfaz(ces) de red. Reinicia el equipo para que surta efecto.`
    };
  },

  async revertFromValue(previousValue: unknown): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    if (!Array.isArray(previousValue)) {
      return { success: false, message: "No se pudo determinar el estado anterior de las interfaces de red.", error: "INVALID_RESTORE_POINT" };
    }

    let allOk = true;
    for (const raw of previousValue) {
      const entry = raw as Partial<NagleInterfaceSnapshot>;
      if (typeof entry.path !== "string") continue;

      const ok1 =
        entry.tcpAckFrequency == null
          ? await deleteRegValueIfPresent(entry.path, "TcpAckFrequency")
          : await writeRegDword(entry.path, "TcpAckFrequency", String(entry.tcpAckFrequency));
      const ok2 =
        entry.tcpNoDelay == null
          ? await deleteRegValueIfPresent(entry.path, "TCPNoDelay")
          : await writeRegDword(entry.path, "TCPNoDelay", String(entry.tcpNoDelay));

      if (!ok1 || !ok2) allOk = false;
    }

    if (!allOk) {
      logOperation(`Restaurar: ${NAGLE_TWEAK_NAME}`, "FAILURE", "No se pudo revertir el valor en todas las interfaces de red.");
      return { success: false, message: "No se pudo restaurar el ajuste en todas las interfaces de red.", error: "REG_COMMAND_FAILED" };
    }

    logOperation(`Restaurado: ${NAGLE_TWEAK_NAME}`, "SUCCESS");
    return { success: true, message: "Nagle's Algorithm y ACK diferido restaurados a su estado anterior en todas las interfaces." };
  }
};

// ─── Tweaks adicionales de red para gaming ───────────────────────────────────

/**
 * QoS packet scheduler — por defecto Windows reserva el 20% del ancho de
 * banda disponible para el QoS Packet Scheduler.
 * Fuente: Microsoft KB316666, Battle(non)sense, Calypto.
 */
export const disableQosReservedBandwidthTweak: Tweak = createRegistryToggleTweak({
  id: "disable-qos-reserved-bandwidth",
  name: "Remove QoS reserved bandwidth (20% limit)",
  description:
    "Elimina la reserva del 20% de ancho de banda que Windows asigna al QoS Packet Scheduler " +
    "(HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched\\NonBestEffortLimit = 0). " +
    "Con este tweak el 100% del ancho de banda queda disponible para tus aplicaciones y juegos online. " +
    "No afecta a la priorización de paquetes, solo libera el ancho de banda reservado " +
    "que de otra forma nunca se usaba.",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SOFTWARE\\Policies\\Microsoft\\Windows\\Psched",
  valueName: "NonBestEffortLimit",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "20"
});

/**
 * Desactiva EnableWsd (Web Service Discovery) que genera tráfico mDNS
 * periódico y puede causar picos de latencia durante partidas.
 */
export const disableWsdTweak: Tweak = createRegistryToggleTweak({
  id: "disable-wsd-network-discovery",
  name: "Disable WSD network discovery background traffic",
  description:
    "Desactiva Web Service Discovery (WSD), que envía broadcast de detección de dispositivos " +
    "en la red local de forma periódica " +
    "(HKLM\\SYSTEM\\...\\Tcpip\\Parameters\\EnableWsd = 0). " +
    "Este tráfico de fondo puede introducir picos de latencia puntuales durante partidas online. " +
    "La exploración manual de red en el Explorador de archivos sigue funcionando.",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters",
  valueName: "EnableWsd",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

/**
 * Deshabilitar Large Send Offload (LSO).
 * LSO delega en la NIC el troceado de paquetes TCP grandes. Algunos drivers
 * introducen latencia variable al hacerlo. Fuente: Battle(non)sense, FR33THY.
 */
export const disableLsoTweak: Tweak = createRegistryToggleTweak({
  id: "disable-lso-tcp",
  name: "Disable Large Send Offload (stabilize ping)",
  description:
    "Desactiva Large Send Offload en el stack TCP global " +
    "(HKLM\\SYSTEM\\...\\Tcpip\\Parameters\\EnableTCPChimney = 0). " +
    "LSO permite a la tarjeta de red fraccionar paquetes TCP grandes sin pasar por la CPU, " +
    "pero con drivers de NIC problemáticos introduce latencia variable y spikes de ping. " +
    "Desactivarlo estabiliza el ping a costa de un uso de CPU ligeramente mayor " +
    "en transferencias grandes de archivos.",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters",
  valueName: "EnableTCPChimney",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

/**
 * Aumentar el tamaño del buffer de recepción UDP.
 * Por defecto Windows usa 8 KB. En juegos con mucho tráfico (64+ jugadores)
 * el buffer puede llenarse y causar pérdida de paquetes UDP.
 */
export const increaseUdpBufferSizeTweak: Tweak = createRegistryToggleTweak({
  id: "increase-udp-receive-buffer",
  name: "Increase UDP receive buffer size (gaming)",
  description:
    "Aumenta el buffer de recepción de paquetes UDP de 8 KB a 64 KB " +
    "(HKLM\\SYSTEM\\...\\AFD\\Parameters\\DefaultReceiveWindow = 65536). " +
    "La mayoría de juegos online usan UDP. Con el buffer por defecto, en servidores con " +
    "muchos jugadores o picos de tráfico los paquetes se descartan cuando el buffer se llena " +
    "antes de que la aplicación pueda leerlos. Un buffer mayor reduce esa pérdida de paquetes " +
    "y mejora la estabilidad del ping.",
  category: "Red",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters",
  valueName: "DefaultReceiveWindow",
  valueType: "REG_DWORD",
  enabledValue: "65536",
  disabledValue: "8192"
});

/**
 * Deshabilitar Windows Connect Now (WCN).
 * WCN es un servicio de autoconfiguración WiFi que genera tráfico periódico
 * en segundo plano y puede crear picos de latencia en partidas.
 */
export const disableWcnTweak: Tweak = createRegistryToggleTweak({
  id: "disable-windows-connect-now",
  name: "Disable Windows Connect Now (WCN background traffic)",
  description:
    "Desactiva Windows Connect Now, un servicio de autoconfiguración WiFi que " +
    "genera tráfico de red en segundo plano de forma periódica " +
    "(HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WCN\\Registrars\\EnableRegistrars = 0). " +
    "En partidas online este tráfico de fondo puede añadir picos de latencia puntuales. " +
    "El WiFi y la conexión a internet siguen funcionando con normalidad.",
  category: "Red",
  risk: "LOW",
  impact: "LOW",
  hive: "HKLM",
  keyPath: "SOFTWARE\\Policies\\Microsoft\\Windows\\WCN\\Registrars",
  valueName: "EnableRegistrars",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});
