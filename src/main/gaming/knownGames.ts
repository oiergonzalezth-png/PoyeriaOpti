/**
 * Catálogo de juegos conocidos para autodetección.
 *
 * Cada entrada define:
 * - Los ejecutables posibles del juego (el primero es el principal).
 * - Rutas de instalación típicas en Windows para la detección en disco.
 * - Los procesos relacionados que se deben proteger (no reducir prioridad).
 * - Tweaks específicos del Optimizer que se aplican con este juego.
 * - Un logo SVG inline (fuente: Simple Icons / logos de marca oficiales).
 */

export interface KnownGame {
  /** Identificador único interno */
  id: string;
  /** Nombre visible en la UI */
  name: string;
  /** Ejecutable principal (el que se busca en el listado de procesos) */
  mainExe: string;
  /** Todos los ejecutables asociados al juego/launcher */
  exeAliases: string[];
  /**
   * Ejecutables de launchers que pueden estar corriendo junto al juego
   * pero NO deben usarse para detectarlo como "en ejecución".
   * Si solo está el launcher y no el mainExe, el juego NO se detecta.
   */
  launcherExes: string[];
  /** Rutas parciales típicas en Windows (se comparan con process path) */
  installPaths: string[];
  /** Procesos relacionados que nunca se deben bajar de prioridad */
  protectedProcesses: string[];
  /** IDs de tweaks del Optimizer recomendados para este juego */
  recommendedTweakIds: string[];
  /** Descripción breve */
  description: string;
  /** Color de acento de la marca (hex) */
  brandColor: string;
  /** SVG inline del logo (viewBox 0 0 24 24) */
  logoSvg: string;
}

// ─── SVGs reales (Simple Icons / marcas oficiales) ──────────────────────────

const RIOT_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.458.86 0 7.093l3.353 12.761 2.552-.313-.701-8.024.838-.373 1.447 8.202 4.361-.535-.775-8.857.83-.37 1.591 9.025 4.412-.542-.849-9.708.84-.374 1.74 9.87L24 17.318V3.5Zm.316 19.356.222 1.256L24 23.14v-4.18l-10.22 1.256Z"/></svg>`;

const ROCKSTAR_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.971 6.816h3.241c1.469 0 2.741-.448 2.741-2.084 0-1.3-1.117-1.576-2.19-1.576H6.748l-.777 3.66Zm12.834 8.753h5.168l-4.664 3.228.755 5.087-4.041-3.07L10.599 24l2.536-5.392s-2.95-3.075-2.947-3.075c-.198-.262-.265-.936-.265-1.226 0-.367.024-.739.049-1.134.028-.451.058-.933.058-1.476 0-1.338-.59-2.038-2.036-2.038H5.283l-1.18 5.525H.026L3.269 0h7.672c2.852 0 5.027.702 5.027 3.936 0 2.276-1.12 3.894-3.592 4.233v.045c1.162.276 1.598 1.062 1.598 2.527 0 .585-.018 1.098-.034 1.581-.015.428-.03.834-.03 1.243 0 .525.137 1.382.48 1.968h.567l3.028-5.06.82 5.096Zm-1.233-2.948-2.187 3.654h-3.457l2.103 2.189-1.73 3.672 3.777-2.218 2.976 2.263-.553-3.731 3.093-2.139h-3.43l-.592-3.69Z"/></svg>`;

const EPIC_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V18.44a4.262 4.262 0 00.02.433c.031.3.037.59.316.92.027.033.311.245.311.245.153.075.258.13.43.2l8.335 3.491c.433.199.614.276.928.27h.002c.314.006.495-.071.928-.27l8.335-3.492c.172-.07.277-.124.43-.2 0 0 .284-.211.311-.243.28-.33.285-.621.316-.92a4.261 4.261 0 00.02-.434V1.879c0-1.373-.506-1.88-1.878-1.88zm13.366 3.11h.68c1.138 0 1.688.553 1.688 1.696v1.88h-1.374v-1.8c0-.369-.17-.54-.523-.54h-.235c-.367 0-.537.17-.537.539v5.81c0 .369.17.54.537.54h.262c.353 0 .523-.171.523-.54V8.619h1.373v2.143c0 1.144-.562 1.71-1.7 1.71h-.694c-1.138 0-1.7-.566-1.7-1.71V4.82c0-1.144.562-1.709 1.7-1.709zm-12.186.08h3.114v1.274H6.117v2.603h1.648v1.275H6.117v2.774h1.74v1.275h-3.14zm3.816 0h2.198c1.138 0 1.7.564 1.7 1.708v2.445c0 1.144-.562 1.71-1.7 1.71h-.799v3.338h-1.4zm4.53 0h1.4v9.201h-1.4zm-3.13 1.235v3.392h.575c.354 0 .523-.171.523-.54V4.965c0-.368-.17-.54-.523-.54z"/></svg>`;

const EA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.635 6.162l-5.928 9.377H4.24l1.508-2.3h4.024l1.474-2.335H2.264L.79 13.239h2.156L0 17.84h12.072l4.563-7.259 1.652 2.66h-1.401l-1.473 2.299h4.347l1.473 2.3H24zm-11.461.107L3.7 8.604l9.52-.035 1.474-2.3z"/></svg>`;

const STEAM_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>`;

const UBISOFT_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.561 11.988C23.301-.304 6.954-4.89.656 6.634c.282.206.661.477.943.672a11.747 11.747 0 00-.976 3.067 11.885 11.885 0 00-.184 2.071C.439 18.818 5.621 24 12.005 24c6.385 0 11.556-5.17 11.556-11.556v-.455zm-20.27 2.06c-.152 1.246-.054 1.636-.054 1.788l-.282.098c-.108-.206-.37-.932-.488-1.908C2.163 10.308 4.7 6.96 8.57 6.33c3.544-.52 6.937 1.68 7.728 4.758l-.282.098c-.087-.087-.228-.336-.77-.878-4.281-4.281-11.002-2.32-11.956 3.74zm11.002 2.081a3.145 3.145 0 01-2.59 1.355 3.15 3.15 0 01-3.155-3.155 3.159 3.159 0 012.927-3.144c1.018-.043 1.972.51 2.416 1.398a2.58 2.58 0 01-.455 2.95c.293.205.575.4.856.595zm6.58.12c-1.669 3.782-5.106 5.766-8.77 5.712-7.034-.347-9.083-8.466-4.38-11.393l.207.206c-.076.108-.358.325-.791 1.182-.51 1.041-.672 2.081-.607 2.732.369 5.67 8.314 6.83 11.045 1.214C21.057 8.217 11.822.401 3.626 6.374l-.184-.184C5.599 2.808 9.816 1.3 13.837 2.309c6.147 1.55 9.453 7.956 7.035 13.94z"/></svg>`;

const ACTIVISION_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.88 8.91L0 14.284h.985l.27-.718h1.252l.269.718h.985zm3.224.359l-.537.984h2.15v4.03H7.7v-4.03h1.522l1.882 4.837 1.791-4.837h4.567l-.537-.984H12.18l-1.074 2.865L9.94 9.269zm16.21 1.163v3.762h.986v-1.523l1.7 1.702v-3.76h-.896v1.342zm-15.94.09c-1.075 0-1.881.807-1.881 1.881 0 1.075.806 1.88 1.88 1.88.448 0 .895-.179 1.164-.447L6 12.94c-.18.18-.358.27-.627.27a.897.897 0 01-.895-.896c0-.448.358-.896.895-.896.18 0 .448.089.537.268l.627-.715c-.27-.269-.716-.448-1.164-.448zm7.522 0v3.672h.985v-3.671zm2.148 0c-.358 0-.804.18-.804.896 0 .896 1.074 1.433.985 1.792-.09.179-.27.178-.359.178h-.626v.806h1.074c.448 0 .895-.269.895-.806 0-.985-1.253-1.611-.984-1.97 0-.09.178-.09.178-.09h.628v-.805zm1.255 0v3.672h.984v-3.671zm3.045 0c-1.075 0-1.88.807-1.88 1.881 0 .985.805 1.88 1.88 1.88 1.074 0 1.88-.805 1.88-1.88 0-1.074-.806-1.88-1.88-1.88zm-11.016.09v3.672h.986v-3.672zm11.016.896c.448 0 .895.358.895.895a.897.897 0 01-.895.896c-.538 0-.985-.358-.896-.896 0-.448.358-.895.896-.895zm-17.464.178l.27.896h-.54z"/></svg>`;

// Logo genérico con silueta de joystick para juegos sin marca identificada
const GENERIC_GAME_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 7A5.5 5.5 0 0 1 23 12.5C23 16.09 20.09 19 16.5 19c-1.68 0-3.2-.63-4.35-1.65L12 17.2l-.15.15A5.98 5.98 0 0 1 7.5 19C3.91 19 1 16.09 1 12.5S3.91 6 7.5 6H8v1.5H7.5C4.74 7.5 2.5 9.74 2.5 12.5S4.74 17.5 7.5 17.5c1.4 0 2.65-.55 3.57-1.43L12 15.16l.93.91c.92.88 2.17 1.43 3.57 1.43 2.76 0 5-2.24 5-5S18.76 8.5 16 8.5h-.5V7h2zM9 10v2H7v2H5v-2H3v-2h2V8h2v2zm8.75.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-2.5-2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>`;

// ─── SVGs específicos de cada juego ─────────────────────────────────────────

// Fortnite: icono con la "F" estilizada de Fortnite / batalla
const FORTNITE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 2h16v3h-9v4h8v3h-8v10h-4V2h13v3H4z" fill-rule="evenodd"/></svg>`;

// Minecraft: cubo de grass block pixelado
const MINECRAFT_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 2h9v9H2zm11 0h9v9h-9zm0 11h9v9h-9zM2 13h9v9H2z"/></svg>`;

// Rocket League: cohete estilizado
const ROCKET_LEAGUE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.5 2 3.7 4.8 2.2 8.8L5 10c1-2.8 3.7-4.8 7-4.8s6 2 7 4.8l2.8-1.2C20.3 4.8 16.5 2 12 2zM2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-.5 0-1-.1-1.5L19 11.8c0 .1.1.2.1.3 0 3.9-3.1 7-7 7s-7-3.1-7-7c0-.1 0-.2.1-.3L2.1 10.5C2 11 2 11.5 2 12zm10-4c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>`;

// CS2: icono de Counter-Strike (cabeza con mira)
const CS2_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 7.32 4.74L12 12l-7.32-3.26A8 8 0 0 1 12 4zM4 12c0-.28.02-.55.05-.82L9 13.5 6.34 18.4A8 8 0 0 1 4 12zm8 8a8 8 0 0 1-4.34-1.28L11 13.62l1 .44 1-.44 3.34 5.1A8 8 0 0 1 12 20zm4.34-1.28L13.93 13.5l4.95-2.32c.03.27.05.54.05.82a8 8 0 0 1-2.59 5.72z"/></svg>`;

// Valorant: logo V con punta de bala
const VALORANT_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h4l6 12 6-12h4L12 22 2 3z"/></svg>`;

// Overwatch: logo O con rayos
const OVERWATCH_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.57 0 3.04.46 4.27 1.26L7.26 16.27A6.966 6.966 0 0 1 5 12c0-3.86 3.14-7 7-7zm0 14c-1.57 0-3.04-.46-4.27-1.26l9.01-9.01A6.966 6.966 0 0 1 19 12c0 3.86-3.14 7-7 7z"/></svg>`;

// Cyberpunk: logo CP77 simplificado (cuadrado con diagonal)
const CYBERPUNK_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h7l11 18H13L3 3zm2.5 2L14 20h4.5L10 5H5.5z"/></svg>`;

// Elden Ring / FromSoftware: árbol estilizado (Erdtree)
const ELDEN_RING_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l-1 5H7l3.5 3-1.5 5 4-2.5 4 2.5-1.5-5L19 7h-4L12 2zM11 14v8h2v-8h-2z"/></svg>`;

// Dota 2: escudo con D
const DOTA2_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 6v6c0 5 3.9 9.7 9 11 5.1-1.3 9-6 9-11V6l-9-4zm-2 5h3c2.2 0 4 1.8 4 4s-1.8 4-4 4h-3V7zm2 2v4h1c1.1 0 2-.9 2-2s-.9-2-2-2h-1z"/></svg>`;

// GTA V: estrella de cinco puntas (sheriff badge / rating)
const GTA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.9 6.1L22 9.2l-5 5 1.2 7-6.2-3.4L5.8 21.2l1.2-7-5-5 7.1-1.1z"/></svg>`;

// League of Legends: casco estilizado
const LOL_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7 2 3 6 3 11c0 3.4 1.8 6.4 4.5 8.1V22l4.5-2 4.5 2v-2.9C19.2 17.4 21 14.4 21 11c0-5-4-9-9-9zm0 2c3.9 0 7 3.1 7 7 0 2.6-1.4 4.9-3.5 6.2V15h-7v2.2C6.4 15.9 5 13.6 5 11c0-3.9 3.1-7 7-7zm-3 5v4h2v-2h2v2h2v-4h-6z"/></svg>`;

// Apex Legends: logo A con ápice
const APEX_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 20h4l1.5-3h9L18 20h4L12 2zm0 4.5L15.5 15h-7L12 6.5z"/></svg>`;

// COD Warzone: calavera estilizada
const COD_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.6 2 4 5.6 4 10c0 2.9 1.5 5.5 3.8 7H8v3h8v-3h.2C18.5 15.5 20 12.9 20 10c0-4.4-3.6-8-8-8zM9 16v-1h6v1H9zm1-3v-2h1v-1h2v1h1v2h-4zm2-5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;

// Rainbow Six Siege: escudo con línea
const R6_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 6v7c0 4.5 3.8 8.7 9 10 5.2-1.3 9-5.5 9-10V6l-9-4zm0 2.2L20 8v5c0 3.5-2.9 6.9-8 8.1-5.1-1.2-8-4.6-8-8.1V8l8-3.8zM8 10v4h1v-1.5l2 1.5h1.5l-2.2-1.8c.7-.3 1.2-1 1.2-1.7 0-1.1-.9-1.5-2-1.5H8zm1 1h1c.5 0 1 .2 1 .6s-.5.9-1 .9H9v-1.5z"/></svg>`;

// Diablo IV: D angular con fuego implícito
const DIABLO_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h6c4.4 0 8 3.6 8 8s-3.6 8-8 8H5V3zm2 2v12h4c3.3 0 6-2.7 6-6s-2.7-6-6-6H7z"/></svg>`;

// Hearthstone / Blizzard: corazón con armadura
const HEARTHSTONE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.6C5.4 18 2 13.6 2 9.5 2 6.4 4.4 4 7.5 4c1.7 0 3.2.8 4.5 2.1C13.3 4.8 14.8 4 16.5 4 19.6 4 22 6.4 22 9.5c0 4.1-3.4 8.5-10 12.1z"/></svg>`;

// Rust: pieza de engranaje oxidada
const RUST_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2c1.5 0 2.9.4 4.1 1.1l-1.8 3.1A4 4 0 0 0 12 8a4 4 0 0 0-2.3.8L7.9 5.1A8 8 0 0 1 12 4zm-6.9 3.1l3.1 1.8A4 4 0 0 0 8 12a4 4 0 0 0 .2 1.2l-3.1 1.8A8 8 0 0 1 4 12c0-1.8.6-3.5 1.1-4.9zm13.8 0C19.4 8.5 20 10.2 20 12a8 8 0 0 1-1.1 4.1l-3.1-1.8c.1-.4.2-.8.2-1.2a4 4 0 0 0-.2-1.2l3.1-1.8zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4.1 4.9A4 4 0 0 0 12 16a4 4 0 0 0 2.3-.8l1.8 3.1A8 8 0 0 1 12 20a8 8 0 0 1-4.1-1.1l1.8-3.1H7.9z"/></svg>`;

// Destiny 2: triángulo con ojo (Ghost)
const DESTINY_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 19h20L12 3zm0 4l6.5 11h-13L12 7zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>`;

// World of Warcraft: horda/alianza (casco simple)
const WOW_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C9 2 6 4 5 7H4v2h1v1H4v2h1c0 4 3 7 7 8 4-1 7-4 7-8h1v-2h-1v-1h1V7h-1c-1-3-4-5-7-5zm0 2c2 0 4 1.3 5 3H7c1-1.7 3-3 5-3zm-5 5h10c0 3-2 5.5-5 6.5-3-1-5-3.5-5-6.5z"/></svg>`;

// StarCraft 2: terran/protoss simplificado
const SC2_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.3L19 8v8l-7 3.9L5 16V8l7-3.7zM8 9v6h2v-2.5l2 2.5h2.5l-2.5-3 2.5-3H12l-2 2.5V9H8z"/></svg>`;

// Battlefield: soldado con mira cruzada
const BATTLEFIELD_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 2v4H7l5 4 5-4h-4V2h-2zM4 11v2h4l-4 5h3l3-4 3 4h3l-4-5h4v-2H4z"/></svg>`;

// The Sims 4: diamante/plumbob
const SIMS_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l-4 5 4 2 4-2-4-5zM8 8l-4 2 8 12 8-12-4-2-4 2-4-2z"/></svg>`;

// FC / FIFA: balón de fútbol
const FC_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c1.6 0 3.1.4 4.4 1.2L14 8h-4L7.6 5.2C8.9 4.4 10.4 4 12 4zM5.3 6.4L8 9.2V14l-3.5-1.5C4.2 11.7 4 10.9 4 10c0-1.3.5-2.6 1.3-3.6zm13.4 0C19.5 7.4 20 8.7 20 10c0 .9-.2 1.7-.5 2.5L16 14V9.2l2.7-2.8zm-5.4 2.8l2.8 2-1.1 3.3h-6L7.9 12l2.8-2h2.6zM4.6 14.3L8 15.7V18l-2.1-1.3c-.6-.9-1.1-1.9-1.3-3zm14.8 0c-.2 1.1-.7 2.1-1.3 3L16 18v-2.3l3.4-1.4zm-12.2 4L9 20.4c-1.2-.6-2.2-1.4-3-2.4l1.2.3zm9.6 0l1.8.3c-.8 1-1.8 1.8-3 2.4l1.2-2.7zm-7.2.5l1.4 1.8c-.5-.2-1-.4-1.4-.8zm4.8 0l-.1 1c-.4.3-.9.6-1.4.8l1.5-1.8z"/></svg>`;

// PUBG: cabeza con casco militar
const PUBG_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8 2 5 5 5 9v1c0 2 1 3.8 2.5 5L7 22h10l-.5-7C18 13.8 19 12 19 10V9c0-4-3-7-7-7zm0 2c2.8 0 5 2.2 5 5v1c0 1.5-.7 2.9-1.8 3.8L14.5 20h-5L8.8 13.8C7.7 12.9 7 11.5 7 10V9c0-2.8 2.2-5 5-5z"/></svg>`;

// Red Dead Redemption 2: estrella del sheriff
const RDR2_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l1.6 4.2 4.4.4-3.2 3 1 4.3L12 11.7l-3.8 2.2 1-4.3-3.2-3 4.4-.4L12 2zm0 7.5L10.6 11l.5 2.1-1.9-1.1-1.9 1.1.5-2.1-1.6-1.5 2.1-.2L12 7l.7 2.3 2.1.2-1.6 1.5.5 2.1-1.9-1.1-1.9 1.1.5-2.1z"/></svg>`;

// Team Fortress 2: sombrero de mercenario / medalla
const TF2_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L4 9v2h16V9l-8-6zM4 13v1c0 3.9 3.1 7 8 8 4.9-1 8-4.1 8-8v-1H4zm5 2h6v2h-6v-2z"/></svg>`;

// Terraria: pico (herramienta icónica)
const TERRARIA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4l-6 6-2-2-2 2 2 2-8 8 2 2 8-8 2 2 2-2-2-2 6-6-2-2z"/></svg>`;

// ─── Catálogo ────────────────────────────────────────────────────────────────

export const KNOWN_GAMES: KnownGame[] = [
  {
    id: "gta5",
    name: "GTA V",
    mainExe: "GTA5.exe",
    exeAliases: ["GTA5.exe", "PlayGTAV.exe", "GTAVLauncher.exe"],
    launcherExes: ["PlayGTAV.exe", "GTAVLauncher.exe"],
    installPaths: ["Rockstar Games\\Grand Theft Auto V", "GTAV", "Grand Theft Auto V"],
    protectedProcesses: ["SocialClubHelper.exe", "RockstarService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Grand Theft Auto V — Rockstar Games",
    brandColor: "#F7941D",
    logoSvg: GTA_SVG
  },
  {
    id: "fortnite",
    name: "Fortnite",
    mainExe: "FortniteClient-Win64-Shipping.exe",
    exeAliases: [
      "FortniteLauncher.exe",
      "FortniteClient-Win64-Shipping.exe"
    ],
    launcherExes: [],
    installPaths: ["Fortnite\\FortniteGame", "Epic Games\\Fortnite"],
    protectedProcesses: ["EpicGamesLauncher.exe", "EasyAntiCheat.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead"],
    description: "Fortnite — Epic Games",
    brandColor: "#2B63D9",
    logoSvg: FORTNITE_SVG
  },
  {
    id: "valorant",
    name: "Valorant",
    mainExe: "VALORANT-Win64-Shipping.exe",
    exeAliases: [
      "Valorant.exe",
      "VALORANT-Win64-Shipping.exe",
      "RiotClientServices.exe"
    ],
    launcherExes: [],
    installPaths: ["Riot Games\\VALORANT", "VALORANT\\live"],
    protectedProcesses: ["RiotClientServices.exe", "vgc.exe", "vgtray.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Valorant — Riot Games",
    brandColor: "#FF4655",
    logoSvg: VALORANT_SVG
  },
  {
    id: "league-of-legends",
    name: "League of Legends",
    mainExe: "League of Legends.exe",
    exeAliases: [
      "League of Legends.exe",
      "LeagueClient.exe",
      "LeagueClientUx.exe"
    ],
    launcherExes: [],
    installPaths: ["Riot Games\\League of Legends", "League of Legends"],
    protectedProcesses: ["LeagueClient.exe", "RiotClientServices.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "League of Legends — Riot Games",
    brandColor: "#C8AA6E",
    logoSvg: LOL_SVG
  },
  {
    id: "apex-legends",
    name: "Apex Legends",
    mainExe: "r5apex.exe",
    exeAliases: ["r5apex.exe", "EADesktop.exe", "Origin.exe"],
    launcherExes: ["EADesktop.exe", "Origin.exe"],
    installPaths: ["Origin Games\\Apex Legends", "EA Games\\Apex Legends", "Apex Legends"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe", "EasyAntiCheat.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Apex Legends — EA / Respawn Entertainment",
    brandColor: "#CD4025",
    logoSvg: APEX_SVG
  },
  {
    id: "cod-warzone",
    name: "Call of Duty: Warzone",
    mainExe: "cod.exe",
    exeAliases: ["cod.exe", "ModernWarfare.exe", "BlackOpsColdWar.exe", "MW2.exe"],
    launcherExes: [],
    installPaths: [
      "Call of Duty\\Warzone",
      "Call of Duty Modern Warfare",
      "Battle.net\\Call of Duty"
    ],
    protectedProcesses: ["Battle.net.exe", "BattlenetLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Call of Duty: Warzone — Activision",
    brandColor: "#4B9F49",
    logoSvg: COD_SVG
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    mainExe: "cs2.exe",
    exeAliases: ["cs2.exe", "csgo.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Counter-Strike Global Offensive", "steamapps\\common\\cs2"],
    protectedProcesses: ["steam.exe", "steamwebhelper.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Counter-Strike 2 — Valve",
    brandColor: "#1b2838",
    logoSvg: CS2_SVG
  },
  {
    id: "minecraft",
    name: "Minecraft",
    mainExe: "javaw.exe",
    exeAliases: ["javaw.exe", "Minecraft.exe", "MinecraftLauncher.exe", "minecraft.exe"],
    launcherExes: ["MinecraftLauncher.exe"],
    installPaths: [".minecraft", "Minecraft Launcher", "Minecraft\\runtime"],
    protectedProcesses: ["MinecraftLauncher.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Minecraft — Mojang Studios / Microsoft",
    brandColor: "#62B47A",
    logoSvg: MINECRAFT_SVG
  },
  {
    id: "rainbow-six-siege",
    name: "Rainbow Six Siege",
    mainExe: "RainbowSix.exe",
    exeAliases: ["RainbowSix.exe", "RainbowSix_BE.exe", "upc.exe"],
    launcherExes: ["RainbowSix_BE.exe", "upc.exe"],
    installPaths: ["Ubisoft\\Rainbow Six Siege", "Tom Clancy's Rainbow Six Siege"],
    protectedProcesses: ["UbisoftGameLauncher.exe", "upc.exe", "BEService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Rainbow Six Siege — Ubisoft",
    brandColor: "#1875F2",
    logoSvg: R6_SVG
  },
  {
    id: "overwatch2",
    name: "Overwatch 2",
    mainExe: "Overwatch.exe",
    exeAliases: ["Overwatch.exe", "Battle.net.exe"],
    launcherExes: ["Battle.net.exe"],
    installPaths: ["Overwatch\\_retail_", "Battle.net\\Overwatch"],
    protectedProcesses: ["Battle.net.exe", "BattlenetLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead"],
    description: "Overwatch 2 — Blizzard Entertainment",
    brandColor: "#F99E1A",
    logoSvg: OVERWATCH_SVG
  },
  {
    id: "cyberpunk2077",
    name: "Cyberpunk 2077",
    mainExe: "Cyberpunk2077.exe",
    exeAliases: ["Cyberpunk2077.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Cyberpunk 2077", "GOG Galaxy\\Games\\Cyberpunk 2077"],
    protectedProcesses: ["steam.exe", "GalaxyClient.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Cyberpunk 2077 — CD Projekt RED",
    brandColor: "#F9E100",
    logoSvg: CYBERPUNK_SVG
  },
  {
    id: "elden-ring",
    name: "Elden Ring",
    mainExe: "eldenring.exe",
    exeAliases: ["eldenring.exe", "start_protected_game.exe"],
    launcherExes: ["start_protected_game.exe"],
    installPaths: ["steamapps\\common\\ELDEN RING"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Elden Ring — FromSoftware / Bandai Namco",
    brandColor: "#C9A84C",
    logoSvg: ELDEN_RING_SVG
  },
  {
    id: "red-dead-redemption-2",
    name: "Red Dead Redemption 2",
    mainExe: "RDR2.exe",
    exeAliases: ["RDR2.exe", "PlayRDR2.exe"],
    launcherExes: ["PlayRDR2.exe"],
    installPaths: ["Rockstar Games\\Red Dead Redemption 2", "steamapps\\common\\Red Dead Redemption 2"],
    protectedProcesses: ["SocialClubHelper.exe", "RockstarService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Red Dead Redemption 2 — Rockstar Games",
    brandColor: "#C4A46A",
    logoSvg: RDR2_SVG
  },
  {
    id: "dota2",
    name: "Dota 2",
    mainExe: "dota2.exe",
    exeAliases: ["dota2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\dota 2 beta"],
    protectedProcesses: ["steam.exe", "steamwebhelper.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Dota 2 — Valve",
    brandColor: "#B22A28",
    logoSvg: DOTA2_SVG
  },
  {
    id: "team-fortress-2",
    name: "Team Fortress 2",
    mainExe: "tf_win64.exe",
    exeAliases: ["tf_win64.exe", "hl2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Team Fortress 2"],
    protectedProcesses: ["steam.exe", "steamwebhelper.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Team Fortress 2 — Valve",
    brandColor: "#7A5230",
    logoSvg: TF2_SVG
  },
  {
    id: "pubg-battlegrounds",
    name: "PUBG: Battlegrounds",
    mainExe: "TslGame.exe",
    exeAliases: ["TslGame.exe", "PUBG.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\PUBG"],
    protectedProcesses: ["steam.exe", "BattlEye.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "PUBG: Battlegrounds — Krafton",
    brandColor: "#F2A900",
    logoSvg: PUBG_SVG
  },
  {
    id: "rust",
    name: "Rust",
    mainExe: "RustClient.exe",
    exeAliases: ["RustClient.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Rust"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Rust — Facepunch Studios",
    brandColor: "#CE4A26",
    logoSvg: RUST_SVG
  },
  {
    id: "destiny2",
    name: "Destiny 2",
    mainExe: "destiny2.exe",
    exeAliases: ["destiny2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Destiny 2"],
    protectedProcesses: ["steam.exe", "BattlEye.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Destiny 2 — Bungie",
    brandColor: "#C4B998",
    logoSvg: DESTINY_SVG
  },
  {
    id: "world-of-warcraft",
    name: "World of Warcraft",
    mainExe: "Wow.exe",
    exeAliases: ["Wow.exe", "WowClassic.exe", "Battle.net.exe"],
    launcherExes: ["Battle.net.exe"],
    installPaths: ["World of Warcraft", "Battle.net\\World of Warcraft"],
    protectedProcesses: ["Battle.net.exe", "BattlenetLauncher.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "World of Warcraft — Blizzard Entertainment",
    brandColor: "#00AEFF",
    logoSvg: WOW_SVG
  },
  {
    id: "diablo4",
    name: "Diablo IV",
    mainExe: "Diablo IV.exe",
    exeAliases: ["Diablo IV.exe", "Battle.net.exe"],
    launcherExes: ["Battle.net.exe"],
    installPaths: ["Diablo IV", "Battle.net\\Diablo IV"],
    protectedProcesses: ["Battle.net.exe", "BattlenetLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Diablo IV — Blizzard Entertainment",
    brandColor: "#A6191E",
    logoSvg: DIABLO_SVG
  },
  {
    id: "hearthstone",
    name: "Hearthstone",
    mainExe: "Hearthstone.exe",
    exeAliases: ["Hearthstone.exe", "Battle.net.exe"],
    launcherExes: ["Battle.net.exe"],
    installPaths: ["Hearthstone", "Battle.net\\Hearthstone"],
    protectedProcesses: ["Battle.net.exe"],
    recommendedTweakIds: ["power-plan"],
    description: "Hearthstone — Blizzard Entertainment",
    brandColor: "#F0B93C",
    logoSvg: HEARTHSTONE_SVG
  },
  {
    id: "starcraft2",
    name: "StarCraft II",
    mainExe: "SC2_x64.exe",
    exeAliases: ["SC2_x64.exe", "Battle.net.exe"],
    launcherExes: ["Battle.net.exe"],
    installPaths: ["StarCraft II", "Battle.net\\StarCraft II"],
    protectedProcesses: ["Battle.net.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "StarCraft II — Blizzard Entertainment",
    brandColor: "#3EC2FF",
    logoSvg: SC2_SVG
  },
  {
    id: "battlefield-2042",
    name: "Battlefield 2042",
    mainExe: "BF2042.exe",
    exeAliases: ["BF2042.exe", "EADesktop.exe", "Origin.exe"],
    launcherExes: ["EADesktop.exe", "Origin.exe"],
    installPaths: ["Battlefield 2042", "EA Games\\Battlefield 2042"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Battlefield 2042 — EA / DICE",
    brandColor: "#FF6B00",
    logoSvg: BATTLEFIELD_SVG
  },
  {
    id: "the-sims-4",
    name: "The Sims 4",
    mainExe: "TS4_x64.exe",
    exeAliases: ["TS4_x64.exe", "EADesktop.exe", "Origin.exe"],
    launcherExes: ["EADesktop.exe", "Origin.exe"],
    installPaths: ["The Sims 4", "EA Games\\The Sims 4"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "The Sims 4 — EA / Maxis",
    brandColor: "#63C34F",
    logoSvg: SIMS_SVG
  },
  {
    id: "ea-sports-fc-24",
    name: "EA Sports FC 24",
    mainExe: "FC24.exe",
    exeAliases: ["FC24.exe", "FC25.exe", "EADesktop.exe"],
    launcherExes: ["EADesktop.exe"],
    installPaths: ["EA SPORTS FC 24", "EA Games\\EA SPORTS FC 24"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe", "EasyAntiCheat.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "EA Sports FC 24 — Electronic Arts",
    brandColor: "#0F1923",
    logoSvg: FC_SVG
  },
  {
    id: "escape-from-tarkov",
    name: "Escape from Tarkov",
    mainExe: "EscapeFromTarkov.exe",
    exeAliases: ["EscapeFromTarkov.exe", "EscapeFromTarkov_BE.exe"],
    launcherExes: ["EscapeFromTarkov_BE.exe"],
    installPaths: ["Battlestate Games\\EFT", "EscapeFromTarkov"],
    protectedProcesses: ["BsgLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Escape from Tarkov — Battlestate Games",
    brandColor: "#8B0000",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "genshin-impact",
    name: "Genshin Impact",
    mainExe: "GenshinImpact.exe",
    exeAliases: ["GenshinImpact.exe", "YuanShen.exe"],
    launcherExes: [],
    installPaths: ["Genshin Impact game", "HoYoverse\\Genshin Impact"],
    protectedProcesses: [],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Genshin Impact — HoYoverse",
    brandColor: "#8AB9F1",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "roblox",
    name: "Roblox",
    mainExe: "RobloxPlayerBeta.exe",
    exeAliases: ["RobloxPlayerBeta.exe"],
    launcherExes: [],
    installPaths: ["Roblox\\Versions"],
    protectedProcesses: [],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Roblox — Roblox Corporation",
    brandColor: "#E2231A",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "terraria",
    name: "Terraria",
    mainExe: "Terraria.exe",
    exeAliases: ["Terraria.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Terraria"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan"],
    description: "Terraria — Re-Logic",
    brandColor: "#5AA02C",
    logoSvg: TERRARIA_SVG
  },
  {
    id: "stardew-valley",
    name: "Stardew Valley",
    mainExe: "Stardew Valley.exe",
    exeAliases: ["Stardew Valley.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Stardew Valley"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan"],
    description: "Stardew Valley — ConcernedApe",
    brandColor: "#8FA83B",
    logoSvg: STEAM_SVG
  },
  {
    id: "among-us",
    name: "Among Us",
    mainExe: "Among Us.exe",
    exeAliases: ["Among Us.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Among Us"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan"],
    description: "Among Us — Innersloth",
    brandColor: "#C51111",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "palworld",
    name: "Palworld",
    mainExe: "Palworld-Win64-Shipping.exe",
    exeAliases: ["Palworld-Win64-Shipping.exe", "Palworld.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Palworld"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Palworld — Pocketpair",
    brandColor: "#3F9C6D",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "baldurs-gate-3",
    name: "Baldur's Gate 3",
    mainExe: "bg3.exe",
    exeAliases: ["bg3.exe", "bg3_dx11.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Baldurs Gate 3", "GOG Galaxy\\Games\\Baldur's Gate 3"],
    protectedProcesses: ["steam.exe", "GalaxyClient.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Baldur's Gate 3 — Larian Studios",
    brandColor: "#9A2A2A",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "hogwarts-legacy",
    name: "Hogwarts Legacy",
    mainExe: "HogwartsLegacy.exe",
    exeAliases: ["HogwartsLegacy.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Hogwarts Legacy", "Epic Games\\HogwartsLegacy"],
    protectedProcesses: ["steam.exe", "EpicGamesLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Hogwarts Legacy — Warner Bros. Games",
    brandColor: "#7C5C2E",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "starfield",
    name: "Starfield",
    mainExe: "Starfield.exe",
    exeAliases: ["Starfield.exe", "SFSE_Loader.exe"],
    launcherExes: ["SFSE_Loader.exe"],
    installPaths: ["steamapps\\common\\Starfield"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Starfield — Bethesda Game Studios",
    brandColor: "#2E86C1",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "the-witcher-3",
    name: "The Witcher 3: Wild Hunt",
    mainExe: "witcher3.exe",
    exeAliases: ["witcher3.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\The Witcher 3", "GOG Galaxy\\Games\\The Witcher 3"],
    protectedProcesses: ["steam.exe", "GalaxyClient.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "The Witcher 3: Wild Hunt — CD Projekt RED",
    brandColor: "#B08D57",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "assassins-creed-valhalla",
    name: "Assassin's Creed Valhalla",
    mainExe: "ACValhalla.exe",
    exeAliases: ["ACValhalla.exe"],
    launcherExes: [],
    installPaths: ["Ubisoft\\Assassin's Creed Valhalla"],
    protectedProcesses: ["UbisoftGameLauncher.exe", "upc.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Assassin's Creed Valhalla — Ubisoft",
    brandColor: "#0E6655",
    logoSvg: UBISOFT_SVG
  },
  {
    id: "far-cry-6",
    name: "Far Cry 6",
    mainExe: "FarCry6.exe",
    exeAliases: ["FarCry6.exe"],
    launcherExes: [],
    installPaths: ["Ubisoft\\Far Cry 6"],
    protectedProcesses: ["UbisoftGameLauncher.exe", "upc.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Far Cry 6 — Ubisoft",
    brandColor: "#E4572E",
    logoSvg: UBISOFT_SVG
  },
  {
    id: "the-division-2",
    name: "Tom Clancy's The Division 2",
    mainExe: "TheDivision2.exe",
    exeAliases: ["TheDivision2.exe"],
    launcherExes: [],
    installPaths: ["Ubisoft\\Tom Clancy's The Division 2"],
    protectedProcesses: ["UbisoftGameLauncher.exe", "upc.exe", "BEService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Tom Clancy's The Division 2 — Ubisoft",
    brandColor: "#C7A008",
    logoSvg: UBISOFT_SVG
  },
  {
    id: "rocket-league",
    name: "Rocket League",
    mainExe: "RocketLeague.exe",
    exeAliases: ["RocketLeague.exe", "EpicGamesLauncher.exe"],
    launcherExes: ["EpicGamesLauncher.exe"],
    installPaths: ["rocketleague\\Binaries", "Epic Games\\rocketleague"],
    protectedProcesses: ["EpicGamesLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Rocket League — Psyonix / Epic Games",
    brandColor: "#1F8EF1",
    logoSvg: ROCKET_LEAGUE_SVG
  },
  {
    id: "helldivers-2",
    name: "Helldivers 2",
    mainExe: "helldivers2.exe",
    exeAliases: ["helldivers2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Helldivers 2"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Helldivers 2 — Arrowhead / PlayStation Studios",
    brandColor: "#E8B923",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "warframe",
    name: "Warframe",
    mainExe: "Warframe.x64.exe",
    exeAliases: ["Warframe.x64.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Warframe"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Warframe — Digital Extremes",
    brandColor: "#3AAFA9",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "path-of-exile",
    name: "Path of Exile",
    mainExe: "PathOfExile_x64.exe",
    exeAliases: ["PathOfExile_x64.exe", "PathOfExile.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Path of Exile", "Grinding Gear Games\\Path of Exile"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Path of Exile — Grinding Gear Games",
    brandColor: "#B99857",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "sea-of-thieves",
    name: "Sea of Thieves",
    mainExe: "SoT.exe",
    exeAliases: ["SoT.exe"],
    launcherExes: [],
    installPaths: ["Microsoft.SeaofThieves", "steamapps\\common\\Sea of Thieves"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Sea of Thieves — Rare / Xbox Game Studios",
    brandColor: "#0F5C82",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "euro-truck-simulator-2",
    name: "Euro Truck Simulator 2",
    mainExe: "eurotrucks2.exe",
    exeAliases: ["eurotrucks2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Euro Truck Simulator 2"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Euro Truck Simulator 2 — SCS Software",
    brandColor: "#1C5FA8",
    logoSvg: STEAM_SVG
  },
  {
    id: "american-truck-simulator",
    name: "American Truck Simulator",
    mainExe: "amtrucks.exe",
    exeAliases: ["amtrucks.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\American Truck Simulator"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "American Truck Simulator — SCS Software",
    brandColor: "#B32B2B",
    logoSvg: STEAM_SVG
  },
  {
    id: "forza-horizon-5",
    name: "Forza Horizon 5",
    mainExe: "ForzaHorizon5.exe",
    exeAliases: ["ForzaHorizon5.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Forza Horizon 5", "ForzaHorizon5content"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Forza Horizon 5 — Playground Games / Xbox Game Studios",
    brandColor: "#F26522",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "forza-motorsport",
    name: "Forza Motorsport",
    mainExe: "ForzaMotorsport.exe",
    exeAliases: ["ForzaMotorsport.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\ForzaMotorsport"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Forza Motorsport — Turn 10 Studios / Xbox Game Studios",
    brandColor: "#2E7DD1",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "microsoft-flight-simulator",
    name: "Microsoft Flight Simulator",
    mainExe: "FlightSimulator.exe",
    exeAliases: ["FlightSimulator.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Microsoft Flight Simulator"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Microsoft Flight Simulator — Asobo Studio / Xbox Game Studios",
    brandColor: "#4A90D9",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "assetto-corsa",
    name: "Assetto Corsa",
    mainExe: "acs.exe",
    exeAliases: ["acs.exe", "AssettoCorsa.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\assettocorsa"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Assetto Corsa — Kunos Simulazioni",
    brandColor: "#D62828",
    logoSvg: STEAM_SVG
  },
  {
    id: "f1-24",
    name: "F1 24",
    mainExe: "F1_24.exe",
    exeAliases: ["F1_24.exe", "EADesktop.exe"],
    launcherExes: ["EADesktop.exe"],
    installPaths: ["steamapps\\common\\F1 24", "EA Games\\F1 24"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "F1 24 — EA Sports / Codemasters",
    brandColor: "#E10600",
    logoSvg: EA_SVG
  },
  {
    id: "need-for-speed-heat",
    name: "Need for Speed Heat",
    mainExe: "NeedForSpeedHeat.exe",
    exeAliases: ["NeedForSpeedHeat.exe", "EADesktop.exe"],
    launcherExes: ["EADesktop.exe"],
    installPaths: ["steamapps\\common\\NFSHeat", "EA Games\\Need for Speed Heat"],
    protectedProcesses: ["EADesktop.exe", "EABackgroundService.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Need for Speed Heat — EA / Ghost Games",
    brandColor: "#FF7A00",
    logoSvg: EA_SVG
  },
  {
    id: "cities-skylines-2",
    name: "Cities: Skylines II",
    mainExe: "Cities2.exe",
    exeAliases: ["Cities2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Cities Skylines II"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Cities: Skylines II — Colossal Order",
    brandColor: "#4C8C4A",
    logoSvg: STEAM_SVG
  },
  {
    id: "farming-simulator-22",
    name: "Farming Simulator 22",
    mainExe: "FarmingSimulator2022Game.exe",
    exeAliases: ["FarmingSimulator2022Game.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Farming Simulator 22"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Farming Simulator 22 — GIANTS Software",
    brandColor: "#F5A623",
    logoSvg: STEAM_SVG
  },
  {
    id: "satisfactory",
    name: "Satisfactory",
    mainExe: "FactoryGame-Win64-Shipping.exe",
    exeAliases: ["FactoryGame-Win64-Shipping.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Satisfactory", "Epic Games\\SatisfactoryEarlyAccess"],
    protectedProcesses: ["steam.exe", "EpicGamesLauncher.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Satisfactory — Coffee Stain Studios",
    brandColor: "#F28C28",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "valheim",
    name: "Valheim",
    mainExe: "valheim.exe",
    exeAliases: ["valheim.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Valheim"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Valheim — Iron Gate Studio",
    brandColor: "#7C9473",
    logoSvg: STEAM_SVG
  },
  {
    id: "no-mans-sky",
    name: "No Man's Sky",
    mainExe: "NMS.exe",
    exeAliases: ["NMS.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\No Man's Sky"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "No Man's Sky — Hello Games",
    brandColor: "#E4572E",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "deep-rock-galactic",
    name: "Deep Rock Galactic",
    mainExe: "FSD-Win64-Shipping.exe",
    exeAliases: ["FSD-Win64-Shipping.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Deep Rock Galactic"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Deep Rock Galactic — Ghost Ship Games",
    brandColor: "#D4A017",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "ark-survival-ascended",
    name: "ARK: Survival Ascended",
    mainExe: "ArkAscended.exe",
    exeAliases: ["ArkAscended.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\ARK Survival Ascended"],
    protectedProcesses: ["steam.exe", "EasyAntiCheat.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "ARK: Survival Ascended — Studio Wildcard",
    brandColor: "#3E7C3E",
    logoSvg: GENERIC_GAME_SVG
  },
  {
    id: "left-4-dead-2",
    name: "Left 4 Dead 2",
    mainExe: "left4dead2.exe",
    exeAliases: ["left4dead2.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Left 4 Dead 2"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Left 4 Dead 2 — Valve",
    brandColor: "#8A1C1C",
    logoSvg: STEAM_SVG
  },
  {
    id: "killing-floor-2",
    name: "Killing Floor 2",
    mainExe: "KFGame.exe",
    exeAliases: ["KFGame.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\killingfloor2"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "Killing Floor 2 — Tripwire Interactive",
    brandColor: "#A32020",
    logoSvg: STEAM_SVG
  },
  {
    id: "fall-guys",
    name: "Fall Guys",
    mainExe: "FallGuys_client_game.exe",
    exeAliases: ["FallGuys_client_game.exe", "EpicGamesLauncher.exe"],
    launcherExes: ["EpicGamesLauncher.exe"],
    installPaths: ["steamapps\\common\\Fall Guys", "Epic Games\\FallGuys"],
    protectedProcesses: ["EpicGamesLauncher.exe"],
    recommendedTweakIds: ["power-plan", "sysmain"],
    description: "Fall Guys — Mediatonic / Epic Games",
    brandColor: "#FFC93C",
    logoSvg: EPIC_SVG
  },
  {
    id: "human-fall-flat",
    name: "Human: Fall Flat",
    mainExe: "Human Fall Flat.exe",
    exeAliases: ["Human Fall Flat.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\Human Fall Flat"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan"],
    description: "Human: Fall Flat — No Brakes Games",
    brandColor: "#5B9BD5",
    logoSvg: STEAM_SVG
  },
  {
    id: "7-days-to-die",
    name: "7 Days to Die",
    mainExe: "7DaysToDie.exe",
    exeAliases: ["7DaysToDie.exe"],
    launcherExes: [],
    installPaths: ["steamapps\\common\\7 Days to Die"],
    protectedProcesses: ["steam.exe"],
    recommendedTweakIds: ["power-plan", "visual-overhead", "sysmain"],
    description: "7 Days to Die — The Fun Pimps",
    brandColor: "#8B4513",
    logoSvg: GENERIC_GAME_SVG
  }
];

/** Mapa exe.toLowerCase() → KnownGame para búsqueda O(1) */
export const KNOWN_GAMES_BY_EXE: Map<string, KnownGame> = new Map(
  KNOWN_GAMES.flatMap((g) => g.exeAliases.map((exe) => [exe.toLowerCase(), g]))
);

/** Devuelve el KnownGame correspondiente a un nombre de ejecutable, o null. */
export function findKnownGameByExe(exeName: string): KnownGame | null {
  return KNOWN_GAMES_BY_EXE.get(exeName.toLowerCase()) ?? null;
}
