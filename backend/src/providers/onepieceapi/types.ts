import type { CharacterStatus } from '../../types/domain';

/**
 * Tipos de la API complementaria https://onepieceapi.com/api.
 *
 * Solo se modelan los campos que consumimos. Cualquier dato ausente se deja en
 * null; nunca se rellena con valores inventados.
 */

export interface LocalizedName {
  en?: string | null;
  romaji?: string | null;
  jp?: string | null;
  pt?: string | null;
}

export interface RawBounty {
  amount?: number | null;
  is_active?: boolean | null;
}

export interface RawCharacter {
  id: string;
  name: LocalizedName | null;
  age?: number | null;
  status?: string | null;
  height?: number | null;
  image_url?: string | null;
  extra_data?: Record<string, unknown> | null;
  bounties?: RawBounty[] | null;
}

export interface RawFruit {
  id: string;
  type?: string | null;
  name: LocalizedName | null;
  model?: LocalizedName | null;
  sub_type?: string | null;
  image_url?: string | null;
}

export interface RawShip {
  id: string;
  name: LocalizedName | null;
  image_url?: string | null;
  type?: string | null;
  status?: string | null;
  extra_data?: Record<string, unknown> | null;
}

/** Registro normalizado de personaje procedente de la fuente de imágenes. */
export interface EnrichmentCharacter {
  id: string;
  names: string[];
  image: string | null;
  age: number | null;
  status: CharacterStatus;
  bounty: number | null;
}

/** Registro normalizado de fruta. `image` solo contiene arte específico. */
export interface EnrichmentFruit {
  id: string;
  name: string;
  romanName: string | null;
  model: string | null;
  modelRomanName: string | null;
  image: string | null;
}

/** Registro normalizado de barco. */
export interface EnrichmentShip {
  id: string;
  names: string[];
  image: string | null;
}
