/** Normaliza texto para búsquedas: minúsculas y sin diacríticos. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Comprueba si un texto contiene una consulta ya normalizada. */
export function matches(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false;
  return normalizeText(haystack).includes(needle);
}
