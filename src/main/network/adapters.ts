import si from "systeminformation";
import type { NetworkAdapterInfo } from "@shared/types/system";

/**
 * Normaliza `iface.type` (que `systeminformation` reporta como "wired",
 * "wireless", "virtual", o vacío) sin adivinar cuando no hay dato.
 */
export function normalizeAdapterType(rawType: string | undefined): string | null {
  if (!rawType) return null;
  const t = rawType.trim().toLowerCase();
  if (t === "wired" || t === "wireless" || t === "virtual") return t;
  return null;
}

export async function getNetworkAdapters(): Promise<NetworkAdapterInfo[]> {
  const [interfaces, defaultIface] = await Promise.all([
    si.networkInterfaces().catch(() => []),
    si.networkInterfaceDefault().catch(() => null)
  ]);

  const list = Array.isArray(interfaces) ? interfaces : [interfaces];

  return list
    .filter((iface) => iface && iface.iface && !iface.internal)
    .map((iface) => ({
      name: iface.ifaceName || iface.iface,
      type: normalizeAdapterType(iface.type),
      ipv4: iface.ip4 || null,
      mac: iface.mac || null,
      speedMbps: typeof iface.speed === "number" && iface.speed > 0 ? iface.speed : null,
      isDefault: defaultIface != null && iface.iface === defaultIface
    }));
}
