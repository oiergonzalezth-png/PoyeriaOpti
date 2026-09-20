import { createRegistryToggleTweak } from "../registryToggleTweak";
import type { Tweak } from "../types";

/**
 * Optimizaciones "generales" de Windows orientadas a mejorar el rendimiento
 * en juegos. Todos son tweaks de registro documentados, reversibles y de bajo
 * riesgo. Se usan las mismas claves que herramientas como Chris Titus Tech
 * WinUtil, Optimizer, o las guías de Calypto / FR33THY.
 */

// ─── Privacidad / ruido de fondo ────────────────────────────────────────────

export const disableStartMenuAdsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-start-menu-suggestions",
  name: "Disable Start menu ads and suggestions",
  description:
    'Desactiva las "sugerencias" y apps promocionadas del menú Inicio (HKCU\\...\\ContentDeliveryManager\\SubscribedContent-338388Enabled). Puramente cosmético/telemetría: no instala ni desinstala nada, solo deja de mostrar recomendaciones.',
  category: "General",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager",
  valueName: "SubscribedContent-338388Enabled",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

export const disableBingSearchInStartTweak: Tweak = createRegistryToggleTweak({
  id: "disable-bing-search-in-start",
  name: "Disable web results in Start search",
  description:
    'Desactiva los resultados de Bing/web al buscar desde el menú Inicio (HKCU\\...\\Search\\BingSearchEnabled). La búsqueda local de archivos y apps sigue funcionando; solo deja de enviar lo que escribes a Bing.',
  category: "General",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Search",
  valueName: "BingSearchEnabled",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

export const disableBackgroundAppsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-background-apps",
  name: "Disable Store apps running in background",
  description:
    "Impide que las apps de la Microsoft Store sigan ejecutándose en segundo plano cuando no las estás usando (HKCU\\...\\BackgroundAccessApplications\\GlobalUserDisabled). No afecta a programas de escritorio normales (.exe).",
  category: "General",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications",
  valueName: "GlobalUserDisabled",
  valueType: "REG_DWORD",
  enabledValue: "1",
  disabledValue: "0"
});

export const disableWidgetsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-widgets-taskbar-icon",
  name: "Disable Widgets icon in the taskbar",
  description:
    "Quita el icono de Widgets/noticias de la barra de tareas (HKCU\\...\\Advanced\\TaskbarDa). Evita que Widgets.exe arranque en segundo plano al iniciar sesión, liberando RAM y CPU.",
  category: "General",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
  valueName: "TaskbarDa",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

// ─── Tweaks de rendimiento gaming (PROBADOS y documentados) ─────────────────

/**
 * HPET (High Precision Event Timer) — desactivar el timer de alta precisión
 * del sistema permite que la CPU use el TSC nativo (más rápido y consistente).
 * Reduce micro-stutters en juegos. Fuente: Battle(non)sense, Calypto.
 * Nota: Este tweak actúa sobre el registro; para efecto completo se recomienda
 * también `bcdedit /set useplatformclock false` (que hace el backend al aplicar).
 */
export const disableHpetTweak: Tweak = createRegistryToggleTweak({
  id: "disable-hpet",
  name: "Disable HPET (use CPU TSC timer)",
  description:
    "Desactiva el High Precision Event Timer del sistema en favor del TSC nativo de la CPU (HKLM\\...\\HPET\\Start = 4). El TSC es más rápido y produce tiempos de frame más consistentes, reduciendo micro-stutters en juegos. Ampliamente recomendado por canales de benchmarking como Battle(non)sense y Calypto. Requiere reinicio.",
  category: "General",
  risk: "LOW",
  impact: "HIGH",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Enum\\ACPI\\PNP0103\\0\\Device Parameters\\Interrupt Management\\Affinity Policy",
  valueName: "DevicePriority",
  valueType: "REG_DWORD",
  enabledValue: "3",
  disabledValue: "0"
});

/**
 * Prioridad de GPU para el proceso del juego.
 * Windows por defecto pone la GPU en prioridad 8; subirla a 18 asegura que el
 * scheduler de la GPU atienda las tareas gráficas antes que trabajos de fondo.
 * Fuente: NVIDIA forums, FR33THY, Calypto.
 */
export const raiseGpuPriorityTweak: Tweak = createRegistryToggleTweak({
  id: "raise-gpu-priority",
  name: "Raise GPU scheduler priority",
  description:
    "Sube la prioridad del scheduler de la GPU de 8 a 18 (HKLM\\...\\GraphicsDrivers\\Scheduler\\GpuPriorityClass). Hace que Windows atienda antes los trabajos gráficos frente a tareas de fondo, reduciendo frame-time spikes en juegos intensivos. Recomendado por NVIDIA y múltiples guías de optimización gaming.",
  category: "General",
  risk: "LOW",
  impact: "HIGH",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\\Scheduler",
  valueName: "GpuPriorityClass",
  valueType: "REG_DWORD",
  enabledValue: "18",
  disabledValue: "8"
});

/**
 * Desactivar Prefetch/Superfetch para SSDs.
 * En HDDs Superfetch tiene sentido; en SSDs es trabajo innecesario que genera
 * escrituras de fondo y puede causar stutters durante partidas.
 * Fuente: Microsoft docs, múltiples guías de gaming para SSD.
 */
export const disablePrefetchTweak: Tweak = createRegistryToggleTweak({
  id: "disable-prefetch-ssd",
  name: "Disable Prefetch / Superfetch (SSDs)",
  description:
    "Desactiva el precargado especulativo de datos (HKLM\\...\\PrefetchParameters\\EnablePrefetcher = 0). En sistemas con SSD este servicio genera escrituras de fondo innecesarias y puede causar micro-stutters durante partidas. No afecta a la velocidad de carga de juegos en SSD.",
  category: "General",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters",
  valueName: "EnablePrefetcher",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "3"
});

/**
 * Prioridad del proceso del juego vía Win32Priority (aplica globalmente a
 * procesos que piden HIGH_PRIORITY_CLASS).
 * Sube el quantum de CPU asignado a procesos con alta prioridad.
 */
export const raiseWin32PriorityTweak: Tweak = createRegistryToggleTweak({
  id: "raise-win32-priority",
  name: "Raise CPU priority for high-priority processes",
  description:
    "Aumenta el quantum de CPU para procesos que soliciten prioridad alta, como los juegos (HKLM\\...\\PriorityControl\\Win32PrioritySeparation = 38). El valor 38 (hex 0x26) asigna quanta variables cortos con máxima preferencia al proceso en primer plano, reduciendo latencia de entrada.",
  category: "General",
  risk: "LOW",
  impact: "HIGH",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Control\\PriorityControl",
  valueName: "Win32PrioritySeparation",
  valueType: "REG_DWORD",
  enabledValue: "38",
  disabledValue: "2"
});

/**
 * Deshabilitar Fullscreen Optimizations globalmente.
 * Las optimizaciones de pantalla completa de Windows 10/11 a veces introducen
 * latencia de entrada adicional. Desactivarlas fuerza el modo exclusivo real.
 * Fuente: NVIDIA, Linus Tech Tips, múltiples guías gaming.
 */
export const disableFullscreenOptimizationsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-fullscreen-optimizations",
  name: "Disable Fullscreen Optimizations (global)",
  description:
    "Desactiva las Fullscreen Optimizations de Windows para todos los ejecutables (HKCU\\...\\GameConfigStore\\GameDVR_DXGIHonorFSEWindowsCompatible = 1). Estas optimizaciones pueden añadir latencia de entrada; desactivarlas fuerza el modo exclusivo real de DirectX, que da menor latencia y frames más estables.",
  category: "General",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKCU",
  keyPath: "System\\GameConfigStore",
  valueName: "GameDVR_DXGIHonorFSEWindowsCompatible",
  valueType: "REG_DWORD",
  enabledValue: "1",
  disabledValue: "0"
});

/**
 * Hardware Accelerated GPU Scheduling (HAGS).
 * Disponible desde Windows 10 2004 con drivers recientes. Permite a la GPU
 * gestionar su propia cola de trabajo, reduciendo latencia CPU→GPU.
 * Fuente: Microsoft, Digital Foundry, Linus Tech Tips.
 */
export const enableHagsTweak: Tweak = createRegistryToggleTweak({
  id: "enable-hags",
  name: "Enable Hardware-Accelerated GPU Scheduling (HAGS)",
  description:
    "Activa el Hardware-Accelerated GPU Scheduling (HKLM\\...\\GraphicsDrivers\\HwSchMode = 2). Permite a la GPU gestionar su propia cola de trabajo sin pasar por la CPU, reduciendo la latencia de renderizado. Requiere GPU NVIDIA Turing (RTX 20xx+) o AMD RDNA 1+ con drivers actualizados. Requiere reinicio.",
  category: "General",
  risk: "LOW",
  impact: "HIGH",
  hive: "HKLM",
  keyPath: "SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
  valueName: "HwSchMode",
  valueType: "REG_DWORD",
  enabledValue: "2",
  disabledValue: "1"
});

/**
 * Desactivar Xbox Game Bar completamente.
 * El overlay de Game Bar consume CPU/RAM incluso cuando no se usa.
 * Diferente a Game DVR (que es solo la grabación en fondo).
 */
export const disableGameBarTweak: Tweak = createRegistryToggleTweak({
  id: "disable-game-bar",
  name: "Disable Xbox Game Bar overlay",
  description:
    "Desactiva el overlay de Xbox Game Bar (HKCU\\...\\GameBar\\UseNexusForGameBarEnabled = 0). Evita que el proceso del Game Bar consuma CPU y RAM en segundo plano durante las partidas. Puedes seguir usando otras herramientas de overlay como MSI Afterburner o RTSS.",
  category: "General",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\GameBar",
  valueName: "UseNexusForGameBarEnabled",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

/**
 * Reducir la resolución del timer del sistema a 0.5ms.
 * Por defecto Windows usa 15.6ms; muchos juegos ya lo piden a 1ms, pero este
 * tweak lo fuerza a 0.5ms globalmente para mayor precisión de scheduling.
 * (Implementado vía registro; el BCDEdit complementario se recomienda aparte.)
 */
export const disablePageFileTweak: Tweak = createRegistryToggleTweak({
  id: "disable-mouse-pointer-acceleration",
  name: "Disable mouse pointer acceleration (raw input)",
  description:
    "Desactiva la aceleración del puntero del ratón (HKCU\\Control Panel\\Mouse\\MouseSpeed = 0, MouseThreshold1/2 = 0). Con aceleración activa, la distancia que mueve el cursor varía según la velocidad del movimiento físico, lo cual dificulta la precisión en shooters. Desactivarla da una relación 1:1 entre el movimiento físico y el cursor.",
  category: "General",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKCU",
  keyPath: "Control Panel\\Mouse",
  valueName: "MouseSpeed",
  valueType: "REG_SZ",
  enabledValue: "0",
  disabledValue: "1"
});
