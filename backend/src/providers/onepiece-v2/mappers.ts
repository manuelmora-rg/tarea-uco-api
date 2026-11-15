import type {
  Arc,
  Boat,
  Bounty,
  Character,
  CharacterStatus,
  Crew,
  CrewStatus,
  EntityRef,
  Fruit,
  Saga,
} from '../../types/domain';

/**
 * Mapeadores del proveedor api-onepiece.com v2.
 *
 * Reglas:
 *  - No se inventan valores. Si el origen no trae un dato, se devuelve null.
 *  - Los errores tipográficos conocidos se normalizan sin alterar el dato
 *    original (se conserva `raw`).
 *  - La API mezcla inglés y francés; se mantiene el texto original.
 */

export interface RawRef {
  id?: number | string | null;
  name?: string | null;
  roman_name?: string | null;
  type?: string | null;
}

export interface RawCharacter {
  id: number;
  name: string;
  size?: string | null;
  age?: string | null;
  bounty?: string | number | null;
  crew?: RawRef | null;
  fruit?: RawRef | null;
  job?: string | null;
  status?: string | null;
}

export interface RawFruit {
  id: number;
  name: string;
  description?: string | null;
  roman_name?: string | null;
  type?: string | null;
  filename?: string | null;
  technicalFile?: string | null;
}

export interface RawCrew {
  id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  roman_name?: string | null;
  total_prime?: string | number | null;
  number?: string | number | null;
  is_yonko?: boolean | null;
}

export interface RawSaga {
  id: number;
  title: string;
  saga_number?: string | number | null;
  saga_chapitre?: string | null;
  saga_volume?: string | null;
  saga_episode?: string | null;
}

export interface RawArc {
  id: number;
  title: string;
  description?: string | null;
  saga?: RawSaga | null;
}

export interface RawBoat {
  id: number;
  name: string;
  description?: string | null;
  type?: string | null;
  roman_name?: string | null;
  crew?: RawRef | null;
  character_captain?: RawCharacter | null;
}

const EMPTY_VALUES = new Set(['', '-', '?', 'null', 'undefined', 'n/a', 'na']);

const BELI_FORMATTER = new Intl.NumberFormat('es-ES');

export function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (EMPTY_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function toId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

export function formatBeli(amount: number): string {
  return `฿ ${BELI_FORMATTER.format(amount)}`;
}

/**
 * Convierte la recompensa del origen a número.
 *
 * El origen usa puntos como separador de miles y contiene erratas como
 * "67.0000.000" (grupo de cuatro ceros). Se corrige únicamente el
 * agrupamiento, nunca se altera la cifra.
 */
export function parseBounty(raw: unknown): Bounty | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return { amount: raw, raw: String(raw), formatted: formatBeli(raw) };
  }

  const text = cleanText(raw);
  if (!text) return null;
  if (!/\d/.test(text)) return null;

  const parts = text.split(/[\s.]+/).filter(Boolean);
  const normalizedParts = parts.map((part, index) => {
    // "0000" dentro de un separador de miles es una errata: equivale a "000".
    if (index > 0 && /^0+$/.test(part) && part.length === 4) return '000';
    return part;
  });

  const digits = normalizedParts.join('').replace(/\D/g, '');
  if (!digits) return null;

  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, raw: text, formatted: formatBeli(amount) };
}

/** Limpia espacios internos y separa la unidad: "2 200cm" -> "2200 cm". */
export function normalizeMeasure(raw: unknown): string | null {
  const text = cleanText(raw);
  if (!text) return null;

  return text
    .replace(/(\d)\s+(?=\d)/g, '$1')
    .replace(/(\d)\s*(cm|km|m|cl|ml|kg|g)\b/gi, '$1 $2');
}

/** "19 ans" -> "19 años" (el origen está parcialmente en francés). */
export function normalizeAge(raw: unknown): string | null {
  const text = cleanText(raw);
  if (!text) return null;
  return text.replace(/\bans?\b/gi, 'años');
}

export function mapCharacterStatus(raw: unknown): CharacterStatus {
  const text = cleanText(raw)?.toLowerCase();
  if (!text) return null;
  if (['vivant', 'living', 'alive'].includes(text)) return 'alive';
  if (['deceased', 'dead', 'mort', 'décédé'].includes(text)) return 'deceased';
  return 'unknown';
}

export function mapCrewStatus(raw: unknown): CrewStatus {
  const text = cleanText(raw)?.toLowerCase();
  if (!text) return 'unknown';
  if (['assets', 'actif', 'active'].includes(text)) return 'active';
  if (['dissolved', 'dissoute', 'disuelta'].includes(text)) return 'dissolved';
  if (['inactive', 'inactif', 'inactivo', 'arrêté', 'arrested'].includes(text)) {
    return 'inactive';
  }
  return 'unknown';
}

function mapRef(raw: RawRef | null | undefined): EntityRef | null {
  if (!raw) return null;
  const name = cleanText(raw.name);
  const id = toId(raw.id);
  if (!name && id === null) return null;
  return {
    id,
    name: name ?? `Registro #${id ?? 'desconocido'}`,
    romanName: cleanText(raw.roman_name),
  };
}

export function mapCharacter(raw: RawCharacter): Character {
  const fruitRef = raw.fruit;
  const fruitName = cleanText(fruitRef?.name);

  return {
    id: raw.id,
    name: cleanText(raw.name) ?? `Personaje #${raw.id}`,
    job: cleanText(raw.job),
    status: mapCharacterStatus(raw.status),
    age: normalizeAge(raw.age),
    height: normalizeMeasure(raw.size),
    bounty: parseBounty(raw.bounty),
    crew: mapRef(raw.crew),
    fruit:
      fruitRef && (fruitName || toId(fruitRef.id))
        ? {
            id: toId(fruitRef.id),
            name: fruitName ?? `Fruta #${fruitRef.id ?? 'desconocida'}`,
            type: cleanText(fruitRef.type),
          }
        : null,
    image: null,
  };
}

export function mapFruit(raw: RawFruit): Fruit {
  return {
    id: raw.id,
    name: cleanText(raw.name) ?? `Fruta #${raw.id}`,
    romanName: cleanText(raw.roman_name),
    type: cleanText(raw.type),
    description: cleanText(raw.description),
    image: cleanText(raw.filename) ?? cleanText(raw.technicalFile),
  };
}

export function mapCrew(raw: RawCrew): Crew {
  const memberCountRaw = toId(raw.number);
  return {
    id: raw.id,
    name: cleanText(raw.name) ?? `Tripulación #${raw.id}`,
    romanName: cleanText(raw.roman_name),
    description: cleanText(raw.description),
    status: mapCrewStatus(raw.status),
    memberCount: memberCountRaw,
    totalBounty: parseBounty(raw.total_prime),
    isYonko: raw.is_yonko === true,
  };
}

export function mapSaga(raw: RawSaga): Saga {
  return {
    id: raw.id,
    title: cleanText(raw.title) ?? `Saga #${raw.id}`,
    number: toId(raw.saga_number),
    chapters: cleanText(raw.saga_chapitre),
    volumes: cleanText(raw.saga_volume),
    episodes: cleanText(raw.saga_episode),
  };
}

export function mapArc(raw: RawArc): Arc {
  return {
    id: raw.id,
    title: cleanText(raw.title) ?? `Arco #${raw.id}`,
    description: cleanText(raw.description),
    saga: raw.saga ? mapSaga(raw.saga) : null,
  };
}

export function mapBoat(raw: RawBoat): Boat {
  const captain = raw.character_captain;
  return {
    id: raw.id,
    name: cleanText(raw.name) ?? `Barco #${raw.id}`,
    romanName: cleanText(raw.roman_name),
    type: cleanText(raw.type),
    description: cleanText(raw.description),
    crew: mapRef(raw.crew),
    captain: captain
      ? {
          id: toId(captain.id),
          name: cleanText(captain.name) ?? `Capitán #${captain.id}`,
          romanName: null,
        }
      : null,
    image: null,
  };
}
