export interface EntityRef {
  id: number | null;
  name: string;
  romanName?: string | null;
}

export interface Bounty {
  amount: number;
  raw: string;
  formatted: string;
}

export type CharacterStatus = 'alive' | 'deceased' | 'unknown' | null;

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

export interface PageMeta {
  provider: string;
  generatedAt: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EntityMeta {
  provider: string;
  generatedAt: string;
}

export interface ListResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface EntityResponse<T> {
  data: T;
  meta: EntityMeta;
}

export interface SearchGroup<T> {
  items: T[];
  total: number;
}

export interface SearchResults {
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

export interface Filters {
  crews: Array<{ id: number; name: string }>;
  fruitTypes: string[];
  sagas: Array<{ id: number; title: string }>;
}

export interface Stats {
  counts: {
    characters: number;
    fruits: number;
    crews: number;
    boats: number;
    arcs: number;
    sagas: number;
    charactersWithBounty: number;
    charactersWithImage: number;
    fruitsWithImage: number;
    boatsWithImage: number;
  };
  featuredCharacters: Character[];
  topBounties: Character[];
  featuredFruits: Fruit[];
  strongestCrew: Crew | null;
  latestArcs: Arc[];
  fruitTypes: string[];
}

export interface ApiMeta {
  provider: {
    key: string;
    label: string;
    capabilities: {
      remoteSearch: boolean;
      remotePagination: boolean;
      images: Record<string, boolean>;
    };
    limitations: string[];
  };
  imageProvider?: {
    key: string;
    label: string;
    capabilities: {
      remoteSearch: boolean;
      remotePagination: boolean;
      images: Record<string, boolean>;
    };
    limitations: string[];
  } | null;
  locale: {
    code: string;
    contentLanguage: string;
    note: string;
  };
  externalApi: {
    name: string;
    version: string;
    documentationStatus: string;
    endpoints: string[];
    role?: string;
  };
  externalApis?: Array<{
    name: string;
    version: string;
    role: string;
    documentation: string | null;
    license: string | null;
    endpoints: string[];
  }>;
}

export interface HealthResponse {
  status: string;
  provider: string;
  uptimeSeconds: number;
  timestamp: string;
}
