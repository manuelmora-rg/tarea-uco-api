import { cleanText, mapCharacterStatus } from '../onepiece-v2/mappers';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
  LocalizedName,
  RawBounty,
  RawCharacter,
  RawFruit,
  RawShip,
} from './types';

function nameList(name: LocalizedName | null | undefined): string[] {
  if (!name) return [];
  return [...new Set([cleanText(name.en), cleanText(name.romaji)].filter(Boolean))] as string[];
}

function firstName(name: LocalizedName | null | undefined, fallback: string): string {
  return cleanText(name?.en) ?? cleanText(name?.romaji) ?? cleanText(name?.jp) ?? fallback;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function currentBounty(rows: RawBounty[] | null | undefined): number | null {
  if (!Array.isArray(rows)) return null;

  const amounts = rows
    .map((row) => positiveNumber(row.amount))
    .filter((amount): amount is number => amount !== null);

  if (amounts.length === 0) return null;

  const active = rows
    .filter((row) => row.is_active === true)
    .map((row) => positiveNumber(row.amount))
    .filter((amount): amount is number => amount !== null);

  return active.length > 0 ? Math.max(...active) : Math.max(...amounts);
}

/**
 * La API nueva usa arte genérico por tipo para muchas frutas.
 * Ese arte no representa una fruta concreta y nunca debe mostrarse como suyo.
 */
export function isGenericFruitImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\/generic-[^/]+$/i.test(url) || /\/generic-/i.test(url);
}

export function mapEnrichmentCharacter(raw: RawCharacter): EnrichmentCharacter {
  return {
    id: raw.id,
    names: nameList(raw.name),
    image: cleanText(raw.image_url),
    age: positiveNumber(raw.age),
    status: mapCharacterStatus(raw.status),
    bounty: currentBounty(raw.bounties),
  };
}

export function mapEnrichmentFruit(raw: RawFruit): EnrichmentFruit {
  const image = cleanText(raw.image_url);
  return {
    id: raw.id,
    name: firstName(raw.name, `Fruta ${raw.id}`),
    romanName: cleanText(raw.name?.romaji),
    model: cleanText(raw.model?.en) ?? cleanText(raw.model?.romaji),
    modelRomanName: cleanText(raw.model?.romaji) ?? cleanText(raw.model?.en),
    image: image && !isGenericFruitImage(image) ? image : null,
  };
}

export function mapEnrichmentShip(raw: RawShip): EnrichmentShip {
  return {
    id: raw.id,
    names: nameList(raw.name),
    image: cleanText(raw.image_url),
  };
}
