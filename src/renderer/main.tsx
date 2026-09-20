import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import App from "./App";
import BridgeError from "./components/BridgeError";
import { SettingsProvider } from "./providers/SettingsProvider";
import "./styles/global.css";
import "./pages/pages.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("No se encontró el nodo #root en index.html");
}

// Si el preload no cargó, no existe ningún puente (window.settings, window.system…):
// en vez de una pantalla en blanco se muestra un mensaje claro.
const bridgeReady =
  typeof window.settings !== "undefined" &&
  typeof window.system !== "undefined" &&
  typeof window.optimizer !== "undefined";

createRoot(container).render(
  <React.StrictMode>
    {bridgeReady ? (
      <SettingsProvider>
        <App />
      </SettingsProvider>
    ) : (
      <BridgeError />
    )}
  </React.StrictMode>
);
