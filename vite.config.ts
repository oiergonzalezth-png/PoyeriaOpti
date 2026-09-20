import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * En producción la app usa la CSP estricta de index.html. El servidor de
 * desarrollo necesita además scripts/estilos en línea (React Refresh, HMR) y
 * un websocket, así que SOLO al servir en desarrollo se sustituye la CSP.
 */
function devContentSecurityPolicy(): Plugin {
  return {
    name: "dev-content-security-policy",
    apply: "serve",
    transformIndexHtml(html) {
      const devPolicy =
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws://localhost:5173; object-src 'none'; base-uri 'none'";
      return html.replace(
        /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
        `<meta http-equiv="Content-Security-Policy" content="${devPolicy}" />`
      );
    }
  };
}

export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  base: "./",
  plugins: [react(), devContentSecurityPolicy()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@renderer": path.resolve(__dirname, "src/renderer")
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist-renderer"),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
