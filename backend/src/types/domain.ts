/**
 * Modelo de dominio interno.
 *
 * Es la frontera entre los proveedores externos y nuestro frontend.
 * Cualquier proveedor nuevo debe adaptar sus respuestas a estas estructuras,
 * de modo que los componentes de React nunca cambien.
 */

export interface EntityRef {
  id: number | null;
  name: string;
  romanName?: string | null;
}

export interface Bounty {
  /** Valor numérico normalizado, en berries. */
  amount: number;
  /** Texto original recibido del proveedor. */
  raw: string;
  /** Representación legible, p. ej. "฿ 3.000.000.000". */
  formatted: string;
}

export type CharacterStatus = 'alive' | 'deceased' | 'unknown' | null;

/**
 * Procedencia de los datos de una entidad.
 *
 * `data` identifica la fuente de los campos principales; `image`, la fuente de
 * la imagen (o null si no hay ninguna); `match`, la estrategia usada para
 * emparejar registros entre fuentes distintas.
 */
export interface EntitySource {
  data: string;
  image: string | null;
  match: string | null;
}

export interface Character {
  id: number;
  name: string;
  job: string | null;
  status: CharacterStatus;
  age: string | null;
  height: string | null;
  bounty: Bounty | null;
  crew: EntityRef | null;
  fruit: (EntityRef & { type: string | null }) | null;
  image: string | null;
  source?: EntitySource;
}

export interface Fruit {
  id: number;
  name: string;
  romanName: string | null;
  type: string | null;
  description: string | null;
  image: string | null;
  source?: EntitySource;
}

export type CrewStatus = 'active' | 'inactive' | 'dissolved' | 'unknown';

export interface Crew {
  id: number;
  name: string;
  romanName: string | null;
  description: string | null;
  status: CrewStatus;
  memberCount: number | null;
  totalBounty: Bounty | null;
  isYonko: boolean;
  source?: EntitySource;
}

export interface CrewDetail extends Crew {
  captain: EntityRef | null;
  members: Character[];
}

export interface Saga {
  id: number;
  title: string;
  number: number | null;
  chapters: string | null;
  volumes: string | null;
  episodes: string | null;
}

export interface Arc {
  id: number;
  title: string;
  description: string | null;
  saga: Saga | null;
}

export interface Boat {
  id: number;
  name: string;
  romanName: string | null;
  type: string | null;
  description: string | null;
  crew: EntityRef | null;
  captain: EntityRef | null;
  image: string | null;
  source?: EntitySource;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchGroup<T> {
  items: T[];
  total: number;
}

export interface GlobalSearchResults {
  query: string;
  total: number;
  groups: {
    characters: SearchGroup<Character>;
    fruits: SearchGroup<Fruit>;
    crews: SearchGroup<Crew>;
    boats: SearchGroup<Boat>;
    arcs: SearchGroup<Arc>;
  };
}

export interface ProviderCapabilities {
  remoteSearch: boolean;
  remotePagination: boolean;
  images: {
    characters: boolean;
    fruits: boolean;
    crews: boolean;
    boats: boolean;
    arcs: boolean;
  };
}
