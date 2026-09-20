import es from "./es";
import en from "./en";
import type { TranslationKey } from "./es";
import type { AppLanguage } from "@shared/types/system";

const DICTIONARIES: Record<AppLanguage, Record<string, string>> = { es, en };

/**
 * Busca `key` en el diccionario de `language` e interpola `vars` con la
 * sintaxis `{nombre}`. Si la clave no existe en ese idioma, cae al
 * diccionario ES y, en último caso, devuelve la propia clave — nunca
 * lanza ni deja un hueco en blanco en la UI.
 */
export function translate(language: AppLanguage, key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = DICTIONARIES[language] ?? DICTIONARIES.es;
  let template = dict[key] ?? DICTIONARIES.es[key] ?? key;

  if (vars) {
    for (const [varName, value] of Object.entries(vars)) {
      template = template.replace(new RegExp(`\\{${varName}\\}`, "g"), () => String(value));
    }
  }

  return template;
}

export function getAvailableLanguages(): AppLanguage[] {
  return Object.keys(DICTIONARIES) as AppLanguage[];
}
