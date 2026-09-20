# Low-End Optimizer

Aplicación de escritorio (Electron + React + TypeScript + Vite) para analizar y optimizar
de forma **segura y reversible** PCs de bajos recursos en Windows.

> Estado actual: **Fases 1 a 10 completadas.** El roadmap original de 10 fases
> está construido. La Fase 10 (empaquetado) se probó de verdad contra un
> `.exe` real de Windows — ver el detalle abajo, incluyendo el único punto
> que no se pudo completar en este entorno (y por qué).

## Cómo ejecutarlo

Requisitos: **Node.js 22.12 o superior** (lo exige Electron 44) y npm.

```bash
npm install
npm run dev
```

Esto arranca Vite (renderer, puerto 5173) y Electron en paralelo. En Windows, la
ventana se abrirá automáticamente con DevTools en modo detached.

Para verificar que todo compila sin ejecutar la app:

```bash
npm run typecheck   # TypeScript, renderer + main
npm run build        # build de producción (renderer con Vite, main con tsc)
npm test              # tests de las partes críticas (whitelist, health score)
```

Para generar el instalador de Windows (`Low-End-Optimizer-Setup.exe`), en una máquina
Windows o con `electron-builder` configurado para cross-build:

```bash
npm run dist
```

## Seguridad

- **Dependencias**: `npm audit` = 0 vulnerabilidades (Electron 44, electron-builder 26,
  Vite 8, Vitest 5).
- **IPC**: todos los handlers pasan por `secureHandle`, que rechaza peticiones cuyo frame
  de origen no sea la propia UI, y validan sus argumentos (`src/main/security/validation.ts`):
  PIDs, ids de registro, ajustes (solo claves conocidas) y perfiles de juego.
- **Ventana**: `will-navigate`/`will-redirect` bloqueados fuera de la app, sin ventanas
  nuevas ni `<webview>`, solo enlaces `https` hacia el navegador, todos los permisos
  denegados, DevTools solo en desarrollo y una sola instancia de la app.
- **CSP estricta** en producción (`default-src 'none'`, sin scripts ni estilos en línea).
- **Comandos de Windows**: `reg`, `sc`, `powercfg`, `ping` y PowerShell se ejecutan por su
  ruta absoluta en `System32` (sin secuestro por PATH), sin shell, y el camino elevado
  (UAC) cita correctamente los argumentos.
- **Registro de inicio**: una entrada solo se modifica si existe de verdad en las claves
  `Run`; los valores guardados en disco se validan antes de restaurarlos.
- **Empaquetado**: fuses de Electron (`RunAsNode`, `NODE_OPTIONS` e inspección por CLI
  desactivados, solo carga desde asar).

## Qué se ha construido en esta fase

### Arquitectura Electron segura
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- El renderer **no tiene acceso directo a Node ni a Electron**. Todo pasa por
  `src/preload/index.ts`, que expone únicamente los puentes `window.system`,
  `window.optimizer`, `window.app`, `window.backup`, `window.gaming`,
  `window.network`, `window.benchmark` y `window.settings` — APIs tipadas y con
  superficie mínima (ver `src/shared/types/system.ts`).
- Los nombres de canal IPC viven en un único sitio (`src/shared/constants/ipcChannels.ts`)
  para que main y preload no puedan desincronizarse.
- **El preload se empaqueta en un único fichero con esbuild** (`npm run build:preload`).
  Un preload con `sandbox: true` solo puede hacer `require("electron")`: si `tsc`
  lo deja con un `require("../shared/...")`, el preload no carga y la app se queda
  sin puentes (`Cannot read properties of undefined (reading 'getSettings')`).
  Con el bundle, las constantes compartidas quedan dentro del propio fichero.

### UI (React + Vite)
- **Diseño**: idea de "signos vitales". Superficies de pizarra azul-verdosa, un único
  acento cobalto para lo interactivo y verde/ámbar/rojo reservados a estados de salud.
  Tema oscuro y claro. Tipografía local (Bricolage Grotesque, sin CDN) usada con
  su eje de ancho: cifras condensadas enormes en la puntuación, texto normal en el resto.
- **Resumen**: puntuación de salud (0-100) con una escala de 20 marcas, **gráfica en
  vivo de CPU y RAM** (SVG propio, datos reales), medidores de recursos, "qué puedes hacer"
  (sugerencias calculadas con datos reales, ver `services/recommendations.ts`) y los
  procesos que más memoria usan.
- **Escaneo**, **Procesos** (con búsqueda y protección de procesos críticos), **Red**,
  **Benchmark antes/después**, **Optimizador** e **Inicio** (interruptores en vez de botones
  Aplicar/Restaurar), **Modo juego**, **Copias y restauración** y **Ajustes**.
- Todos los textos pasan por el sistema de traducción (`src/renderer/i18n`): ES y EN
  completos, con un test que exige las mismas claves en ambos.
- Accesible: foco visible, interruptores con `role="switch"`, respeta
  `prefers-reduced-motion`, funciona hasta el tamaño mínimo de ventana (1024×680).
- Si el preload no llegara a cargar, la app muestra una pantalla de error clara
  (`BridgeError`) en vez de quedarse en blanco, y un `ErrorBoundary` evita que el fallo
  de una pantalla tumbe el resto.

### Backend real (proceso `main`)
- `getHardwareSnapshot()` (Fase 2 completa): usa `systeminformation` para leer:
  - **CPU**: fabricante, modelo, núcleos físicos/lógicos, frecuencia, carga actual
    y **temperatura** (`null` si el sensor no está disponible — habitual en VMs/
    contenedores, y así se ha comprobado en este entorno).
  - **GPU**: fabricante, modelo, VRAM cuando está disponible.
  - **RAM**: total, usada, disponible, porcentaje.
  - **Almacenamiento**: tanto volúmenes lógicos (montajes, sistema de archivos,
    espacio libre) como **discos físicos** (nombre, tipo SSD/NVMe/HDD normalizado
    sin adivinar cuando el dato es ambiguo, capacidad, interfaz).
  - **Windows**: distro, versión, build, Service Pack, arquitectura y si el
    firmware es UEFI.
  Verificado en este entorno (Linux/contenedor) leyendo datos reales de esta
  máquina — incluidos los casos donde un sensor no existe y el código devuelve
  `null`/`[]` en vez de inventarlo. En Windows, `systeminformation` usa WMI/
  registro por debajo y devolverá los datos reales de esa máquina del mismo modo.
- `getProcesses()` / `killProcess(pid)`: lista de procesos real; `killProcess`
  comprueba la whitelist de procesos críticos **en el main process** (no solo en
  la UI) antes de permitir `process.kill`, y registra cada intento en el log.
- **Startup Manager** (Fase 3, completa): lee las entradas reales de
  `HKCU/HKLM ...CurrentVersion\Run` y su estado real (activado/desactivado)
  consultando `...\Explorer\StartupApproved\Run` — el mismo mecanismo que usa
  el Administrador de tareas de Windows. Activar/desactivar:
  - **Nunca elimina la entrada** original de `Run`; solo escribe el marcador
    de estado en `StartupApproved`.
  - **Guarda un punto de restauración** (valor anterior, o su ausencia) ANTES
    de escribir nada, en un store JSON local (`src/main/services/restorePointsStore.ts`,
    diseñado para reutilizarse en el Restore Center de la Fase 4).
  - Si la entrada es de `HKLM` (todo el sistema), la escritura requiere
    permisos de administrador: la app solicita elevación **solo para ese
    comando concreto** vía UAC (`Start-Process -Verb RunAs`), nunca ejecuta
    toda la aplicación como administrador.
  - La página **Startup** incluye un panel "Cambios recientes" con botón
    "Restaurar" por cada cambio aplicado.

  ⚠️ **Limitación de verificación**: la codificación del valor binario de
  `StartupApproved` (documentada extensamente en literatura de forense de
  Windows, no en una API pública de Microsoft) y el flujo de elevación por
  UAC están implementados según esa documentación y cubiertos por tests de
  round-trip, pero **no se ha podido comprobar su efecto real sobre Windows**
  en este entorno (no hay Windows/UAC disponible aquí). Recomiendo validarlo
  en una máquina Windows real —activar/desactivar algo desde la app y
  comprobar en el propio Administrador de tareas de Windows que el cambio se
  refleja correctamente— antes de confiar en ello en producción.
- Logger local en JSON (`src/main/services/logger.ts`), sin datos sensibles.

### Restore Center (Fase 4)
- `RestorePointsStore` (creado en la Fase 3) es el motor genérico de backups
  de toda la app: cada punto guarda `tweakId` (con prefijo de "dominio", p. ej.
  `startup:...`), una `description` legible del cambio, el valor anterior y
  si ya se restauró.
- `restoreDispatcher.ts` es el enrutador central: dado un `restorePointId`,
  identifica el dominio y delega en el módulo que sabe revertirlo — ahora
  mismo solo "startup" está registrado; la Fase 5 registrará "optimizer" del
  mismo modo, **sin tener que tocar el dispatcher ni la UI del Restore
  Center**.
- La página **Backup & Restore** lista TODOS los cambios aplicados por
  cualquier módulo (columnas Módulo / Cambio / Fecha / Estado) con un botón
  "Restore" por fila — la vista central que pedía la spec original
  ("Optimization #1, Date, Changes, Status").
- Verificado de extremo a extremo: cargué el módulo compilado de Startup
  (que se auto-registra como manejador del dominio "startup" al importarse),
  creé un punto de restauración en un store temporal, y llamé a
  `restoreAnyPoint()` — enrutó correctamente al handler real de Startup (no
  a un placeholder), que a su vez bloqueó la operación por no estar en
  Windows, sin fingir éxito.

### Optimizer (Fase 5)
- 6 tweaks reales de bajo/medio riesgo (regla #30: empezar con pocos), cada uno
  con `check()/apply()/restore()` reales — nunca simulados:
  1. **Disable transparency effects** (registro HKCU, riesgo BAJO)
  2. **Disable taskbar animations** (registro HKCU, riesgo BAJO)
  3. **Disable menu fade/scroll animations** (registro HKCU, riesgo BAJO)
  4. **Disable background game recording (Game DVR)** (registro HKCU, riesgo BAJO)
  5. **Set SysMain (Superfetch) to Manual startup** (servicio, `sc.exe`, riesgo
     MEDIO, requiere admin)
  6. **Switch to the High Performance power plan** (`powercfg.exe`, riesgo MEDIO)
  Ninguno borra nada, desactiva Defender/Update, ni promete cifras mágicas — hay
  incluso un test (`tweakRegistry.test.ts`) que falla si algún tweak usara ese
  tipo de lenguaje.
- Los 4 primeros comparten una única fábrica genérica
  (`registryToggleTweak.ts`) que sabe leer/escribir/revertir un valor de
  registro — añadir un quinto tweak de este tipo en el futuro es solo llamar a
  esa fábrica con su configuración, sin tocar nada más (regla #30: extensible
  sin reescribir la app).
- El dominio `"optimizer"` se registra UNA vez en el mismo dispatcher del
  Restore Center de la Fase 4 (`tweakRegistry.ts` → `registerRestoreHandler`),
  así que los tweaks ya aparecen automáticamente en Backup & Restore junto a
  los cambios de Startup, sin código adicional.
- La página **Optimizer** muestra cada tweak como una tarjeta con nombre,
  descripción, categoría, riesgo, impacto y si requiere admin, con botones
  Apply/Restore — el formato exacto de la spec original.
- Verificado en este entorno: cargué el motor compilado, listé los 6 tweaks
  reales (estado `UNKNOWN`, no inventado, porque este no es Windows) e intenté
  aplicar uno — bloqueó correctamente la operación en vez de fingir éxito.

  ⚠️ Igual que con Startup: la escritura de registro/servicio/power plan sigue
  documentación pública establecida, pero no se ha podido validar su efecto
  real en un Windows de verdad desde este entorno.

### Gaming Mode y perfiles (Fase 6)
- **Al activar**: detecta procesos en segundo plano no críticos (excluyendo el
  propio juego y los que el perfil marque como protegidos, p. ej. Discord),
  baja su prioridad a `BelowNormal`, y sube la del proceso del juego (si está
  corriendo) a `High`/`Normal` según el perfil — usando
  `[System.Diagnostics.Process].PriorityClass` vía PowerShell, nunca
  `RealTime` (puede colgar el sistema) ni `Idle` para el juego. Aplica además
  los tweaks del Optimizer que el perfil tenga seleccionados.
- **Al desactivar**: revierte exactamente las prioridades que cambió (las que
  siguen vivas; si un proceso ya terminó, simplemente no hay nada que
  revertir para él — limitación inherente de este tipo de cambio, documentada
  más abajo) y restaura los tweaks aplicados.
- **Perfiles de juego** (`GameProfilesStore`, JSON local): nombre, ruta del
  ejecutable, prioridad, procesos protegidos, y qué tweaks del Optimizer se
  aplican con este perfil. Crear/eliminar desde la página **Gaming**.
- **Sin promesas mágicas** (regla #31): la descripción en la propia UI dice
  explícitamente que esto es "una redistribución razonable de prioridad, no
  magia" — nada de "FPS x2" ni "ping a 0".
- Toda la lógica de selección de procesos y de construcción/parseo de los
  comandos de PowerShell está separada en funciones puras
  (`processSelection.ts`, `priorityCommands.ts`) y cubierta por tests, sin
  tocar el sistema real durante el test.
- Verificado en este entorno: cargué el motor compilado real de Gaming Mode
  contra un `electron` simulado (sin necesidad de pantalla) y confirmé que
  **todo el grafo de módulos de main** —los 5 conjuntos de handlers IPC,
  incluidos los registros de dominio de Startup y Optimizer en el Restore
  Center— carga e inicializa sin errores.

  ⚠️ **Limitación inherente, no solo de este entorno**: cambiar la prioridad
  de un proceso es, por naturaleza, algo que vive mientras el proceso vive —
  si el proceso termina antes de desactivar Gaming Mode, no hay nada que
  "restaurar" para él (a diferencia de un valor de registro, que persiste).
  Esto está documentado en el propio código, no es un descuido.

### Network diagnostics (Fase 7)
- **Ping/latencia/jitter/pérdida de paquetes**: usa el comando `ping` real
  del sistema operativo y parsea su salida (soporta el formato de Windows en
  inglés y español, y el de Linux/macOS). El host de referencia es `1.1.1.1`
  (resolutor público de Cloudflare, no requiere resolver DNS primero).
- **DNS configurado**: usa `dns.getServers()`, una API nativa de Node/libuv
  que lee la configuración real del sistema — no hace falta parsear
  `ipconfig`. Verificado en este entorno: devuelve los DNS reales de esta
  máquina (`8.8.8.8`, `8.8.4.4`).
- **Adaptadores de red**: usa `systeminformation` (mismo paquete que Fase 2)
  para nombre, tipo (cableado/wifi/virtual), IP, MAC y velocidad del enlace.
  Verificado en este entorno: devuelve el adaptador real de este contenedor.
- **Descarga/subida**: petición HTTPS real (módulo nativo `https` de Node, sin
  dependencias nuevas) contra los endpoints públicos de test de velocidad de
  Cloudflare (`speed.cloudflare.com/__down` / `__up`), midiendo bytes
  transferidos entre el tiempo real transcurrido. **Verificado de extremo a
  extremo en este entorno** apuntando el mismo mecanismo a un dominio
  alcanzable desde este sandbox (`raw.githubusercontent.com`): la descarga
  real se completó y el cálculo de Mbps fue correcto.
- **Ninguna sub-prueba bloquea a las demás**: si el ping falla (de hecho,
  en este contenedor no hay binario `ping` instalado y el código lo maneja
  devolviendo `null` en vez de romperse) o la subida no responde, el resto
  de resultados se muestran igual, con los fallos listados explícitamente en
  `errors` — nunca se oculta un fallo mostrando un cero o inventando un dato.
- La página **Network** muestra ping/jitter/pérdida/descarga/subida, el DNS
  configurado y los adaptadores, con un botón **Run Network Test** — el
  formato de la spec original. No promete que cambiar el DNS reduzca el ping
  "mágicamente": solo mide y muestra.

  ⚠️ El endpoint de Cloudflare (`speed.cloudflare.com`) no está en la lista de
  dominios accesibles desde este sandbox de desarrollo, así que no pude
  verificar la medición contra ÉL específicamente (solo contra un dominio
  alternativo alcanzable, con el mismo código). En una máquina Windows real
  con acceso a internet normal debería funcionar igual, pero conviene
  confirmarlo ahí.

### Benchmark antes/después (Fase 8)
- Reutiliza por completo la detección de hardware (Fase 2) y el listado de
  procesos (Fase 1/3) que ya existían — no hay una nueva capa de detección,
  solo un snapshot con 4 métricas: uso de CPU, uso de RAM, número de
  procesos, y uso de disco.
- **"Capture Before"** guarda un snapshot; **"Capture After"** guarda otro y
  la UI calcula la diferencia (`computeBenchmarkDiff`, función pura testeada)
  campo por campo, mostrando `N/A` en vez de un número inventado si algún
  lado falta. Capturar un nuevo "Before" descarta cualquier "After" previo,
  para que no se pueda comparar un "after" contra el "before" equivocado.
- **Nunca mide FPS** (regla #15: "No inventar FPS") — solo métricas del
  propio sistema operativo, que sí se pueden comprobar honestamente sin
  instrumentar el juego.
- Verificado en este entorno: capturé un snapshot real contra esta máquina
  (CPU, RAM, procesos y disco reales, no inventados) y cargué el grafo
  completo de módulos de `main` (ahora con Benchmark incluido) sin errores.

### Settings + internacionalización (Fase 9)
- **Start with Windows**: real, no decorativo. Añade/quita una entrada propia
  (`LowEndOptimizer`) en `HKCU\...\Run` con la ruta real del ejecutable
  (`app.getPath('exe')`). A diferencia del Startup Manager (que nunca borra
  entradas de terceros), aquí la app gestiona SU PROPIA entrada, así que
  añadirla/quitarla al activar/desactivar es el comportamiento correcto, no
  una excepción a la regla.
- **Minimize to tray**: real. Al cerrar la ventana con esta opción activa, se
  oculta en vez de cerrarse y aparece un icono en la bandeja del sistema con
  menú "Abrir" / "Salir". El icono se genera en tiempo real con un
  **codificador PNG propio** (`pngIcon.ts`: CRC-32 + `zlib.deflateSync`, sin
  dependencias nuevas) — no es un asset de marca final, es un cuadrado sólido
  del color de acento de la app, pero es un PNG 100% válido, no un
  placeholder roto. Lo verifiqué con dos decodificadores independientes
  (`file` y Pillow/Python): confirman 16×16 RGBA con el color exacto pedido.
- **Notifications**: toggle real + botón "Enviar notificación de prueba" que
  usa `Notification` nativo de Electron de verdad (no simulado).
- **Dark/Light theme**: real, con variables CSS separadas para ambos temas
  (`global.css`), aplicado vía `<body data-theme="...">`.
- **Idioma (ES/EN)**: sistema de traducciones real
  (`src/renderer/i18n/`: `es.ts`, `en.ts`, `translate.ts` + un
  `SettingsProvider` de React que expone `t()` a toda la app). Un test
  (`translate.test.ts`) comprueba que **ambos diccionarios tienen exactamente
  las mismas claves** — no puede quedar una clave sin traducir en un idioma
  sin que el test lo detecte.
  ⚠️ **Cobertura honesta**: el sistema de i18n está migrado por completo en
  Sidebar, Dashboard, Settings y ComingSoon — cambiar el idioma en Settings
  cambia esas pantallas de verdad. El resto de páginas (PC Scan, Processes,
  Startup, Optimizer, Gaming, Network, Benchmark, Backup & Restore) siguen
  con texto en español hardcodeado, pendiente de migrar en una pasada
  posterior — la arquitectura ya está lista para ello (regla #25: "preparar
  la arquitectura"), pero no reclamo que el 100% de la app esté traducido.
- Verificado en este entorno: `setStartWithWindows` bloquea correctamente en
  no-Windows sin fingir éxito, y el grafo completo de módulos de `main`
  (ahora con Settings + Tray) carga sin errores usando un `electron`
  simulado que incluye `Tray`, `Menu`, `nativeImage` y `Notification`.

### Empaquetado final (Fase 10)

- **Icono real de la app** (`build/icon.ico`): generado con un codificador
  ICO propio (`icoIcon.ts`, reutiliza el codificador PNG de la Fase 9),
  16/32/48/256 px. Verificado con `file` y Pillow/Python: es un `.ico` de
  Windows 100% válido con los 4 tamaños. Como con el icono de la bandeja: es
  funcional, no la identidad de marca final (un cuadrado del color de
  acento) — no se ha fabricado un logo falso pretendiendo ser oficial.
- **Configuración de `electron-builder`** (en `package.json`): target NSIS
  x64, instalador no-oneClick con opción de elegir carpeta, acceso directo
  de escritorio y menú inicio, nombre de desinstalación y `publish` configurado
  para GitHub Releases (`oiergonzalezth-png/PoyeriaOpti`).
- **Auto-actualizaciones**: integrado `electron-updater` de verdad
  (`src/main/updates/autoUpdater.ts`), activo solo en builds empaquetados
  (`app.isPackaged`). Usa GitHub Releases como proveedor y descarga/instala el
  instalador NSIS mediante `electron-updater`. No modifica `app.asar` en caliente,
  no crea `update.zip` y no necesita `companion.exe` ni un `.bat` auxiliar.

#### 🏆 Verificación real: se generó un `.exe` de Windows real y funcional

Esto es lo más lejos que he podido llegar verificando este proyecto en este
entorno, y quiero ser preciso sobre qué se comprobó exactamente:

1. Ejecuté `electron-builder` de verdad contra este proyecto (no un mock).
   Descargó el runtime real de Electron para Windows x64 desde GitHub,
   empaquetó la app, y generó `release/win-unpacked/Low-End Optimizer.exe`.
2. `file` confirma que es un **`PE32+ executable (GUI) x86-64, for MS
   Windows`** — un binario de Windows real, no un placeholder.
3. Listé el `app.asar` empaquetado dentro y contiene **literalmente todo
   nuestro código compilado de las 9 fases**: `dist-renderer` (la UI React),
   `dist-electron/main` completo (hardware, startup, optimizer, gaming,
   network, benchmark, settings, utils), preload y shared types.
4. El instalador NSIS (`makensis`) también se generó correctamente en Linux
   sin necesitar Wine — llegué a tener un `Low-End-Optimizer-Setup.exe` real
   (formato "Nullsoft Installer self-extracting archive" confirmado por
   `file`) en una prueba con el paso de icono desactivado.
5. **Lo único que no se pudo completar en este entorno**: el paso final de
   `electron-builder` que incrusta el icono/metadatos en el `.exe`
   (`rcedit.exe`, una herramienta de Windows) necesita Wine para ejecutarse
   desde Linux. Instalé `wine64` (funcionó la descarga e instalación vía los
   repositorios de Ubuntu), pero el propio *loader* de Wine no puede
   ejecutarse dentro de este contenedor concreto (`wine: could not exec the
   wine loader`, incluso para comandos triviales como `wine --version` —
   revisé bibliotecas con `ldd` sin encontrar nada roto, así que apunta a
   una restricción del entorno en sí, no a un fallo de configuración).

**En la práctica esto no debería ser un problema real**: en una máquina
Windows de verdad, `npm run dist` no necesita Wine en absoluto (todo el
`rcedit`/firma se ejecuta nativamente). Y si prefieres compilar desde Linux
o macOS, cualquier entorno con Wine funcionando de verdad (la mayoría de
distros de escritorio, o un runner de CI como GitHub Actions
`windows-latest`) completará el paso que aquí se quedó bloqueado. Esto es
una limitación de este sandbox concreto, no del proyecto.

### Tests
- `tests/processes.test.ts`: valida la whitelist de procesos críticos.
- `tests/healthScore.test.ts`: valida que el Health Score nunca inventa un factor
  que no está disponible, y que responde correctamente a sistemas con carga alta.
- `tests/hardwareInfo.test.ts`: valida que la normalización de tipo de disco
  (SSD/NVMe/HDD) nunca "adivina" cuando el dato es ambiguo o no existe.
- `tests/startupApproved.test.ts`: valida el round-trip de codificación del
  valor binario `StartupApproved` (habilitado/deshabilitado) y que un byte de
  estado desconocido nunca se interpreta como un valor por defecto.
- `tests/restorePointsStore.test.ts`: valida el ciclo de vida de los puntos
  de restauración (guardar, listar por orden, marcar como restaurado,
  persistencia entre instancias).
- `tests/restoreDispatcher.test.ts`: valida que el Restore Center enruta al
  módulo correcto según el dominio del punto, y que rechaza correctamente
  puntos inexistentes, ya restaurados, o de un dominio sin handler.
- `tests/tweakRegistry.test.ts`: valida que hay entre 5 y 10 tweaks, todos con
  id único y campos completos, que ninguno usa lenguaje exagerado/prohibido
  por la regla #31, que ninguno es de riesgo HIGH en este lote inicial, y que
  aplicar/restaurar un id desconocido o en una plataforma no soportada nunca
  finge éxito.
- `tests/priorityCommands.test.ts`: valida la construcción/parseo de los
  comandos de PowerShell de prioridad de proceso, y que `RealTime`/`Idle`
  nunca se aceptan como valores válidos.
- `tests/processSelection.test.ts`: valida que Gaming Mode nunca selecciona
  procesos críticos, el propio juego, o procesos protegidos por el perfil.
- `tests/gameProfilesStore.test.ts`: valida el CRUD de perfiles de juego.
- `tests/ping.test.ts`: valida el parseo de la salida de `ping` en formato
  Windows (inglés y español) y Unix, incluyendo el caso de 100% de pérdida
  de paquetes sin estadísticas de latencia.
- `tests/speedTest.test.ts`: valida el cálculo de Mbps a partir de
  bytes/tiempo, y que nunca divide por cero.
- `tests/adapters.test.ts`: valida que el tipo de adaptador nunca se adivina
  ante un valor desconocido.
- `tests/benchmarkDiff.test.ts`: valida el cálculo Before/After/Diff, y que
  el diff nunca se inventa cuando falta alguno de los dos lados.
- `tests/benchmarkStore.test.ts`: valida el ciclo de vida before/after
  (incluido que capturar un nuevo "before" descarta el "after" anterior).
- `tests/pngIcon.test.ts`: valida que el PNG generado para la bandeja tiene
  la firma correcta, los chunks en orden, y que al descomprimir el IDAT se
  obtienen exactamente los píxeles del color pedido.
- `tests/settingsStore.test.ts`: valida los valores por defecto, el update
  parcial, y que un fichero corrupto no rompe la lectura.
- `tests/translate.test.ts`: valida que ES y EN tienen las mismas claves,
  que ninguna traducción está vacía, la interpolación de variables, y que
  una clave inexistente nunca deja la UI en blanco.
- `tests/icoIcon.test.ts`: valida la cabecera ICO, el número de imágenes
  declaradas, y que cada entrada del directorio apunta a datos PNG válidos
  (verificado descomprimiendo y comprobando la firma PNG en el offset
  exacto que el propio fichero declara).
- Todos pasan (`npm test` → 91/91).

## Qué falta (pulido opcional, ninguna fase del roadmap original queda pendiente)

- **UX de "Optimize Windows" con checklist en vivo** (pulido de la Fase 5):
  la spec pide que al aplicar optimizaciones se muestre una lista real de
  pasos ("✓ Creating backup", "✓ Applying safe optimization", ...) en vez de
  un simple "Optimizing...". Ahora mismo cada tweak se aplica individualmente
  con su propio botón; falta el flujo de aplicación en lote con esa checklist.
- **i18n al 100% de la app** (pulido de la Fase 9): Sidebar, Dashboard,
  Settings y ComingSoon ya están migrados de verdad; el resto de páginas
  siguen con texto en español fijo, pendiente de pasar por `t()`.
- **Firma de código** (pulido de la Fase 10): `electron-builder` ya está
  configurado para firmar si le das un certificado (`CSC_LINK`/`CSC_KEY_PASSWORD`
  como variables de entorno estándar de electron-builder); no puedo generar
  ni inventar un certificado de firma de código, eso solo lo puede aportar
  el propio proyecto/organización.
- **Icono de marca final** (pulido de la Fase 10): `build/icon.ico` ya
  existe y es válido, pero es un icono genérico funcional, no el diseño de
  marca definitivo — sustitúyelo por el logo real cuando lo tengas.

### Publicar una actualización

1. Cambia `version` en `package.json` (por ejemplo, `1.0.3`).
2. Ejecuta `npm run release` con `GH_TOKEN` o `GITHUB_TOKEN` configurado.
3. `electron-builder` genera el instalador NSIS y los metadatos `latest.yml`; esos artefactos se publican en GitHub Releases.
4. Las instalaciones existentes detectarán la nueva versión y, al pulsar **Descargar e instalar**, `electron-updater` descargará el instalador y lo aplicará al cerrar la aplicación.

El proyecto ya no utiliza `update.zip`, `companion.exe`, `companion.js` ni scripts `.bat` para el intercambio de archivos. `electron-updater` es quien gestiona el instalador y el reinicio.

## Problemas conocidos / limitaciones de este entorno

- Este proyecto se ha desarrollado y verificado (typecheck, build, tests, arranque
  de Electron con sus procesos main/gpu/renderer/utility) en un contenedor Linux,
  ya que es el entorno disponible aquí. La lógica de detección de hardware
  (`systeminformation`) es multiplataforma por diseño, pero **algunas funciones
  son intencionalmente no-operativas fuera de Windows** (lectura/escritura del
  registro de inicio) y se comprueba `os.platform()` antes de ejecutarlas.
- El mecanismo de activar/desactivar inicio (`StartupApproved`) y el flujo de
  elevación por UAC para entradas `HKLM` están implementados según documentación
  pública de terceros y cubiertos por tests de la lógica pura, pero **su
  comportamiento real contra el registro y el UAC de Windows no se ha podido
  verificar en este entorno**. Antes de confiar en esta función, pruébala en una
  máquina Windows real: activa/desactiva un elemento desde la app y confirma en
  el propio Administrador de tareas de Windows que el estado coincide.
- No se ha podido verificar visualmente la ventana renderizada (captura de
  pantalla) en este entorno por no disponer de un pipeline de captura gráfica
  fiable; sí se ha verificado que Electron arranca sin errores de módulos y
  carga el proceso de renderer correctamente.

## Estructura del proyecto

```
src/
  main/            proceso principal de Electron
    ipc/           registro de handlers ipcMain.handle
    services/      logger, etc.
    system/        hardwareInfo, processes, startup, killProcess
  preload/         único puente renderer <-> main (contextBridge)
  renderer/        app React
    components/    Sidebar, MetricCard, HealthScoreGauge
    pages/         Dashboard, Scan, Processes, ComingSoon
    hooks/         useHardwareSnapshot, useProcesses
    services/      healthScore
    styles/        tokens globales
  shared/
    types/         contrato de tipos entre main/preload/renderer
    constants/     nombres de canal IPC
tests/             tests de vitest para lógica crítica
```
