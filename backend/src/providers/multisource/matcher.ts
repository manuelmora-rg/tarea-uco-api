import type { Boat, Character, Fruit } from '../../types/domain';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
} from '../onepieceapi/types';

export type MatchStrategy =
  | 'name'
  | 'name-shared-image'
  | 'verified'
  | 'roman-name'
  | 'name-model';

export interface EntityMatch<T> {
  record: T;
  strategy: MatchStrategy;
  image: string | null;
}

export type CharacterMatch = EntityMatch<EnrichmentCharacter>;
export type FruitMatch = EntityMatch<EnrichmentFruit>;
export type ShipMatch = EntityMatch<EnrichmentShip>;

/**
 * Normalización común para comparar nombres entre fuentes:
 * minúsculas, sin diacríticos y con cualquier signo convertido en espacio.
 */
export function normalizeName(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Variantes de un nombre: completo, sin paréntesis y cada alias separado por
 * «/» o «|». Se usa en ambos lados del emparejamiento.
 */
export function nameVariants(value: string | null | undefined): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  const withoutParentheses = raw.replace(/\s*\([^)]*\)\s*/g, ' ');
  const aliases = raw
    .split(/\s*[/|]\s*/)
    .flatMap((part) => [part, part.replace(/\s*\([^)]*\)\s*/g, ' ')]);

  return [
    ...new Set(
      [raw, withoutParentheses, ...aliases]
        .map(normalizeName)
        .filter(Boolean),
    ),
  ];
}

function pushUnique<T>(index: Map<string, T[]>, key: string, record: T): void {
  const bucket = index.get(key);
  if (!bucket) {
    index.set(key, [record]);
    return;
  }
  if (!bucket.includes(record)) bucket.push(record);
}

function uniqueRecords<T>(records: T[]): T[] {
  return [...new Set(records)];
}

function parseAge(value: string | null): number | null {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function containsKey(text: string, key: string): boolean {
  if (!key) return false;
  return (
    text === key ||
    text.startsWith(`${key} `) ||
    text.endsWith(` ${key}`) ||
    text.includes(` ${key} `)
  );
}

function selectCharacter(
  character: Character,
  candidates: EnrichmentCharacter[],
): CharacterMatch | null {
  if (candidates.length === 1) {
    const record = candidates[0]!;
    return { record, strategy: 'name', image: record.image };
  }

  const distinctImages = new Set(
    candidates.map((candidate) => candidate.image).filter(Boolean),
  );

  // Los duplicados de nombre solo son seguros si comparten exactamente la
  // misma imagen (o si todos carecen de imagen y se verifican por otros datos).
  if (distinctImages.size === 1) {
    const record = candidates.find((candidate) => candidate.image) ?? candidates[0]!;
    return { record, strategy: 'name-shared-image', image: record.image };
  }

  const oldBounty = character.bounty?.amount ?? null;
  const oldAge = parseAge(character.age);
  const oldStatus = character.status;

  const scored = candidates
    .map((record) => {
      let score = 0;
      if (oldBounty !== null && record.bounty === oldBounty) score += 3;
      if (oldAge !== null && record.age === oldAge) score += 1;
      if (oldStatus && record.status === oldStatus) score += 1;
      return { record, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const second = scored[1];
  if (best.score > 0 && best.score > (second?.score ?? -1)) {
    return { record: best.record, strategy: 'verified', image: best.record.image };
  }

  return null;
}

/**
 * Empareja personajes de la fuente principal con la fuente de imágenes.
 * Nunca asocia una imagen cuando hay candidatos distintos sin verificación.
 */
export function matchCharacters(
  primary: readonly Character[],
  catalog: readonly EnrichmentCharacter[],
): Map<number, CharacterMatch> {
  const index = new Map<string, EnrichmentCharacter[]>();

  for (const record of catalog) {
    for (const name of record.names) {
      for (const key of nameVariants(name)) pushUnique(index, key, record);
    }
  }

  const matches = new Map<number, CharacterMatch>();

  for (const character of primary) {
    const candidates = uniqueRecords(
      nameVariants(character.name).flatMap((key) => index.get(key) ?? []),
    );
    if (candidates.length === 0) continue;

    const match = selectCharacter(character, candidates);
    if (match) matches.set(character.id, match);
  }

  return matches;
}

/**
 * Empareja frutas usando el nombre romanizado y, cuando hay varias frutas con
 * la misma base (p. ej. Hito Hito no Mi), el modelo. Solo se consideran frutas
 * con arte específico; las imágenes genéricas ya vienen filtradas del catálogo.
 */
export function matchFruits(
  primary: readonly Fruit[],
  catalog: readonly EnrichmentFruit[],
): Map<number, FruitMatch> {
  const specific = catalog.filter((fruit) => fruit.image !== null);
  const index = new Map<string, EnrichmentFruit[]>();

  for (const fruit of specific) {
    for (const name of [fruit.romanName, fruit.name]) {
      for (const key of nameVariants(name)) pushUnique(index, key, fruit);
    }
  }

  const matches = new Map<number, FruitMatch>();

  for (const fruit of primary) {
    const romanKeys = nameVariants(fruit.romanName);
    const nameKeys = nameVariants(fruit.name);
    const directKeys = [...romanKeys, ...nameKeys];

    let candidates = uniqueRecords(
      directKeys.flatMap((key) => index.get(key) ?? []),
    );

    const oldText = normalizeName(
      [fruit.name, fruit.romanName].filter(Boolean).join(' '),
    );

    if (candidates.length === 0 && oldText) {
      candidates = specific.filter((candidate) => {
        const bases = [
          ...nameVariants(candidate.romanName),
          ...nameVariants(candidate.name),
        ];
        return bases.some((base) => containsKey(oldText, base));
      });
    }

    if (candidates.length === 0) continue;

    let usedModel = false;
    if (candidates.length > 1) {
      const modelMatches = candidates.filter((candidate) => {
        const models = [candidate.model, candidate.modelRomanName]
          .map((model) => normalizeName(model))
          .filter(Boolean);
        return models.some((model) => containsKey(oldText, model));
      });

      if (modelMatches.length === 1) {
        candidates = modelMatches;
        usedModel = true;
      } else {
        const images = new Set(candidates.map((candidate) => candidate.image));
        if (images.size !== 1) continue;
      }
    }

    const record = candidates[0]!;
    matches.set(fruit.id, {
      record,
      strategy: usedModel ? 'name-model' : romanKeys.length > 0 ? 'roman-name' : 'name',
      image: record.image,
    });
  }

  return matches;
}

/** Empareja barcos por nombre oficial o romanizado, con verificación de duplicados. */
export function matchShips(
  primary: readonly Boat[],
  catalog: readonly EnrichmentShip[],
): Map<number, ShipMatch> {
  const index = new Map<string, EnrichmentShip[]>();

  for (const record of catalog) {
    for (const name of record.names) {
      for (const key of nameVariants(name)) pushUnique(index, key, record);
    }
  }

  const matches = new Map<number, ShipMatch>();

  for (const boat of primary) {
    const nameCandidates = uniqueRecords(
      nameVariants(boat.name).flatMap((key) => index.get(key) ?? []),
    );
    const romanCandidates = uniqueRecords(
      nameVariants(boat.romanName).flatMap((key) => index.get(key) ?? []),
    );
    const candidates = uniqueRecords([...romanCandidates, ...nameCandidates]);

    if (candidates.length === 0) continue;

    if (candidates.length === 1) {
      const record = candidates[0]!;
      matches.set(boat.id, {
        record,
        strategy: romanCandidates.length > 0 && nameCandidates.length === 0
          ? 'roman-name'
          : 'name',
        image: record.image,
      });
      continue;
    }

    const images = new Set(candidates.map((candidate) => candidate.image).filter(Boolean));
    if (images.size === 1) {
      const record = candidates.find((candidate) => candidate.image) ?? candidates[0]!;
      matches.set(boat.id, {
        record,
        strategy: 'name-shared-image',
        image: record.image,
      });
    }
  }

  return matches;
}
