import { createRegistryToggleTweak } from "../registryToggleTweak";
import type { Tweak } from "../types";

export const disableTransparencyTweak: Tweak = createRegistryToggleTweak({
  id: "disable-transparency-effects",
  name: "Disable transparency effects",
  description:
    "Desactiva los efectos de transparencia/acrílico de la barra de tareas y el menú de inicio (HKCU\\...\\Themes\\Personalize\\EnableTransparency). Reduce el trabajo de composición de la GPU/CPU en equipos con gráficos integrados. Efecto puramente visual: la barra de tareas se verá sólida en vez de translúcida.",
  category: "Visual",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
  valueName: "EnableTransparency",
  valueType: "REG_DWORD",
  enabledValue: "0", // "activo" el tweak = transparencia desactivada
  disabledValue: "1" // valor por defecto de Windows = transparencia activada
});

export const disableTaskbarAnimationsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-taskbar-animations",
  name: "Disable taskbar animations",
  description:
    "Desactiva las animaciones de apertura/minimizado de ventanas en la barra de tareas (HKCU\\...\\Advanced\\TaskbarAnimations). Efecto puramente visual, sin impacto funcional: las ventanas aparecen/desaparecen de forma instantánea en vez de animada.",
  category: "Visual",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
  valueName: "TaskbarAnimations",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});

export const disableMenuAnimationsTweak: Tweak = createRegistryToggleTweak({
  id: "disable-menu-animations",
  name: "Disable menu fade/scroll animations",
  description:
    "Desactiva la animación de despliegue de menús (HKCU\\Control Panel\\Desktop\\WindowMetrics\\MinAnimate). Los menús contextuales y de inicio se abren instantáneamente en lugar de desplegarse con una animación.",
  category: "Visual",
  risk: "LOW",
  impact: "LOW",
  hive: "HKCU",
  keyPath: "Control Panel\\Desktop\\WindowMetrics",
  valueName: "MinAnimate",
  valueType: "REG_SZ",
  enabledValue: "0",
  disabledValue: "1"
});

export const disableGameDvrTweak: Tweak = createRegistryToggleTweak({
  id: "disable-game-dvr",
  name: "Disable background game recording (Game DVR)",
  description:
    "Desactiva la grabación en segundo plano de Xbox Game Bar (HKCU\\System\\GameConfigStore\\GameDVR_Enabled). Este servicio captura continuamente los últimos minutos de juego en segundo plano, usando CPU/GPU/disco incluso cuando no se está grabando nada activamente. No afecta a la posibilidad de grabar manualmente con otro programa.",
  category: "Gaming",
  risk: "LOW",
  impact: "MEDIUM",
  hive: "HKCU",
  keyPath: "System\\GameConfigStore",
  valueName: "GameDVR_Enabled",
  valueType: "REG_DWORD",
  enabledValue: "0",
  disabledValue: "1"
});
