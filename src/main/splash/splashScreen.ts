import { BrowserWindow, app } from "electron";
import path from "path";
import fs from "fs";

let splashWindow: BrowserWindow | null = null;

export function createSplashScreen(): BrowserWindow {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 420,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false
    }
  });

  // Intenta leer el logo desde dist (producción) o desde src (desarrollo)
  let logoSrc = "";
  const candidates = [
    path.join(__dirname, "../../../dist-renderer/assets/logo.png"),
    path.join(__dirname, "../../renderer/assets/logo.png"),
    path.join(process.resourcesPath ?? "", "app/dist-renderer/assets/logo.png")
  ];
  for (const p of candidates) {
    try {
      const data = fs.readFileSync(p);
      logoSrc = "data:image/png;base64," + data.toString("base64");
      break;
    } catch { /* siguiente */ }
  }

  const version = app.getVersion();

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 420px; height: 420px;
    background: transparent;
    overflow: hidden;
  }
  .wrapper {
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.45s cubic-bezier(.22,.68,0,1.2) forwards;
  }
  .card {
    width: 210px; height: 210px;
    border-radius: 38px;
    background: #121c22;
    box-shadow:
      0 0 0 1.5px rgba(121,160,255,0.18),
      0 12px 60px rgba(0,0,0,0.75),
      0 0 90px rgba(121,160,255,0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: -1.5px;
    border-radius: 39.5px;
    background: linear-gradient(140deg, rgba(121,160,255,0.45) 0%, transparent 55%);
    z-index: 0;
    border-radius: 39.5px;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1.5px;
    background-clip: padding-box;
  }
  .card img {
    width: 138px; height: 138px;
    object-fit: contain;
    position: relative; z-index: 1;
    filter: drop-shadow(0 0 20px rgba(121,160,255,0.4));
  }
  .spinner-track {
    width: 32px; height: 32px;
    margin-top: 30px;
    position: relative;
  }
  .spinner-track svg {
    animation: spin 1s linear infinite;
    width: 100%; height: 100%;
  }
  .version {
    margin-top: 12px;
    font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
    font-size: 11px;
    color: rgba(165,184,193,0.5);
    letter-spacing: 0.1em;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="wrapper" id="w">
    <div class="card">
      <img src="${logoSrc}" alt="" draggable="false" />
    </div>
    <div class="spinner-track">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" stroke="rgba(121,160,255,0.15)" stroke-width="2.5"/>
        <path d="M16 3 A13 13 0 0 1 29 16" stroke="#79a0ff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="version">v${version}</div>
  </div>
</body>
</html>`;

  splashWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  splashWindow.once("ready-to-show", () => {
    splashWindow?.show();
  });

  return splashWindow;
}

export function closeSplashScreen(): void {
  if (!splashWindow || splashWindow.isDestroyed()) return;

  splashWindow.webContents.executeJavaScript(`
    const w = document.getElementById('w');
    if (w) {
      w.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      w.style.opacity = '0';
      w.style.transform = 'scale(0.92)';
    }
  `).catch(() => {}).finally(() => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
    }, 320);
  });
}
