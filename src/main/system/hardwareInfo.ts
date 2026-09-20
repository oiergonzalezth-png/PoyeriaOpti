import si from "systeminformation";
import os from "os";
import type {
  HardwareSnapshot,
  CpuInfo,
  GpuInfo,
  RamInfo,
  DiskInfo,
  OsInfo,
  PhysicalDiskInfo,
  PhysicalDiskType
} from "@shared/types/system";

/**
 * Normaliza el campo `type` que devuelve `si.diskLayout()` (que varía entre
 * "SSD", "HD", "NVMe", cadenas vacías, etc.) a nuestro tipo cerrado.
 * Si no se puede determinar con certeza, devuelve `null` en vez de adivinar.
 */
export function normalizeDiskType(rawType: string | undefined | null): PhysicalDiskType {
  if (!rawType) return null;
  const t = rawType.trim().toLowerCase();
  if (t.includes("nvme")) return "NVMe";
  if (t.includes("ssd")) return "SSD";
  if (t === "hd" || t.includes("hdd")) return "HDD";
  return null;
}

/**
 * Recoge un snapshot real del hardware/software del equipo.
 * Cualquier dato que la librería no pueda determinar se deja en `null`
 * en lugar de inventarse (ver regla #35 del proyecto: prohibido fake data).
 */
export async function getHardwareSnapshot(): Promise<HardwareSnapshot> {
  const [cpuData, cpuLoad, cpuTemp, gpuData, memData, fsData, diskLayoutData, osData] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.cpuTemperature().catch(() => null),
    si.graphics(),
    si.mem(),
    si.fsSize(),
    si.diskLayout().catch(() => []),
    si.osInfo()
  ]);

  // `si.cpuTemperature()` devuelve -1 (o null) cuando la plataforma no expone
  // el sensor (habitual en VMs/contenedores). Nunca se inventa un valor.
  const rawTemp = cpuTemp?.main;
  const temperatureC = typeof rawTemp === "number" && rawTemp > 0 ? Math.round(rawTemp * 10) / 10 : null;

  const cpu: CpuInfo = {
    manufacturer: cpuData.manufacturer || null,
    brand: cpuData.brand || null,
    physicalCores: cpuData.physicalCores || null,
    logicalCores: cpuData.cores || null,
    speedGhz: cpuData.speed ? Number(cpuData.speed) : null,
    currentLoadPercent: cpuLoad?.currentLoad != null ? Math.round(cpuLoad.currentLoad * 10) / 10 : null,
    temperatureC
  };

  const gpu: GpuInfo[] = (gpuData.controllers || []).map((g) => ({
    vendor: g.vendor || null,
    model: g.model || null,
    vramMb: typeof g.vram === "number" && g.vram > 0 ? g.vram : null
  }));

  const totalMb = Math.round(memData.total / (1024 * 1024));
  // `active` refleja memoria realmente en uso (excluye caches/buffers reclamables),
  // que es la métrica relevante para "RAM disponible" en Windows.
  const usedMb = Math.round(memData.active / (1024 * 1024));
  const availableMb = Math.max(totalMb - usedMb, 0);
  const ram: RamInfo = {
    totalMb,
    usedMb,
    availableMb,
    usedPercent: totalMb > 0 ? Math.round((usedMb / totalMb) * 1000) / 10 : 0
  };

  const disks: DiskInfo[] = (fsData || [])
    .filter((d) => d.size > 0)
    .map((d) => {
      const sizeGb = d.size / (1024 * 1024 * 1024);
      const usedGb = d.used / (1024 * 1024 * 1024);
      return {
        device: d.mount || d.fs,
        type: d.type || null,
        sizeGb: Math.round(sizeGb * 10) / 10,
        freeGb: Math.round((sizeGb - usedGb) * 10) / 10,
        usedPercent: sizeGb > 0 ? Math.round((usedGb / sizeGb) * 1000) / 10 : 0
      };
    });

  const physicalDisks: PhysicalDiskInfo[] = (diskLayoutData || []).map((d) => ({
    name: d.name || d.device || "Unidad desconocida",
    type: normalizeDiskType(d.type),
    sizeGb: typeof d.size === "number" && d.size > 0 ? Math.round((d.size / (1024 * 1024 * 1024)) * 10) / 10 : null,
    interfaceType: d.interfaceType || null
  }));

  const platform = os.platform();
  const osInfo: OsInfo = {
    platform,
    distro: osData.distro || null,
    release: osData.release || null,
    build: osData.build || null,
    arch: os.arch(),
    servicePack: osData.servicepack && osData.servicepack.trim() !== "" ? osData.servicepack : null,
    uefi: typeof osData.uefi === "boolean" ? osData.uefi : null
  };

  return {
    timestamp: new Date().toISOString(),
    cpu,
    gpu,
    ram,
    disks,
    physicalDisks,
    os: osInfo,
    nonWindowsEnvironment: platform !== "win32"
  };
}
