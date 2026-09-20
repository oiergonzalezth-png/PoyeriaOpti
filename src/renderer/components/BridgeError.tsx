import React from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Pantalla que se muestra si el preload no cargó y `window.settings` (y el
 * resto de puentes) no existen. Es bilingüe a propósito: sin puente todavía
 * no se puede leer el idioma elegido en Ajustes.
 */
export default function BridgeError(): React.JSX.Element {
  return (
    <div className="page">
      <div className="empty">
        <div className="empty__icon">
          <TriangleAlert size={22} aria-hidden="true" />
        </div>
        <h1 className="empty__title">No se pudo conectar con el sistema</h1>
        <p className="empty__body">
          La interfaz no recibió el puente de comunicación con Windows. Cierra la app y ábrela de nuevo; si sigue igual,
          reinstálala.
        </p>
        <p className="empty__body">
          Couldn&apos;t connect to the system. The interface didn&apos;t receive the communication bridge. Close and reopen
          the app; if it keeps happening, reinstall it.
        </p>
      </div>
    </div>
  );
}
