import type {
  Arc,
  Boat,
  Character,
  Crew,
  CrewDetail,
  Fruit,
  GlobalSearchResults,
  Paginated,
  Saga,
  SearchGroup,
} from '../types/domain';
import type { DataProvider } from '../providers/provider.interface';
import { TtlCache } from '../utils/ttl-cache';
import { matches, normalizeText } from '../utils/text';
import { NotFoundError } from '../utils/http-error';

export type CharacterSort = 'bounty_desc' | 'bounty_asc' | 'name_asc' | 'name_desc' | 'id_asc';
export type FruitSort = 'name_asc' | 'name_desc' | 'id_asc';
export type CrewSort = 'bounty_desc' | 'bounty_asc' | 'name_asc' | 'name_desc';
export type BoatSort = 'name_asc' | 'name_desc' | 'id_asc';

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface CharacterQuery extends PaginationQuery {
  sort?: CharacterSort;
  crew?: number;
  status?: 'alive' | 'deceased' | 'unknown';
  hasBounty?: boolean;
}

export interface FruitQuery extends PaginationQuery {
  sort?: FruitSort;
  type?: string;
}

export interface CrewQuery extends PaginationQuery {
  sort?: CrewSort;
  status?: 'active' | 'inactive' | 'dissolved' | 'unknown';
}

export interface ArcQuery extends PaginationQuery {
  saga?: number;
}

export interface BoatQuery extends PaginationQuery {
  sort?: BoatSort;
  crew?: number;
}

function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
}

function bountyOf(item: { bounty: { amount: number } | null }): number {
  return item.bounty?.amount ?? 0;
}

function totalBountyOf(item: { totalBounty: { amount: number } | null }): number {
  return item.totalBounty?.amount ?? 0;
}

/** Puntuación simple para ordenar resultados de búsqueda por relevancia. */
function relevance(fields: Array<string | null | undefined>, needle: string): number {
  let best = 0;

  for (const field of fields) {
    if (!field) continue;
    const value = normalizeText(field);

    if (value === needle) best = Math.max(best, 4);
    else if (value.startsWith(needle)) best = Math.max(best, 3);
    else if (value.split(/\s+/).some((word) => word.startsWith(needle))) {
      best = Math.max(best, 2);
    } else if (value.includes(needle)) best = Math.max(best, 1);
  }

  return best;
}

export class CatalogService {
  private readonly cache: TtlCache;

  constructor(
    private readonly provider: DataProvider,
    cacheTtlMs = 600_000,
  ) {
    this.cache = new TtlCache(cacheTtlMs);
  }

  get providerKey(): string {
    return this.provider.key;
  }

  private load<T>(resource: string, loader: () => Promise<T>): Promise<T> {
    return this.cache.getOrLoad(
      `${this.provider.key}:${resource}`,
      loader,
      // Si el enriquecimiento sigue cargando en segundo plano, la respuesta es
      // provisional y no debe quedar cacheada sin imágenes.
      () => !this.provider.isEnrichmentPending?.(resource),
    );
  }

  getCharacters(): Promise<Character[]> {
    return this.load('characters', () => this.provider.getCharacters());
  }

  getFruits(): Promise<Fruit[]> {
    return this.load('fruits', () => this.provider.getFruits());
  }

  getCrews(): Promise<Crew[]> {
    return this.load('crews', () => this.provider.getCrews());
  }

  getSagas(): Promise<Saga[]> {
    return this.load('sagas', () => this.provider.getSagas());
  }

  getArcs(): Promise<Arc[]> {
    return this.load('arcs', () => this.provider.getArcs());
  }

  getBoats(): Promise<Boat[]> {
    return this.load('boats', () => this.provider.getBoats());
  }

  async listCharacters(query: CharacterQuery): Promise<Paginated<Character>> {
    const all = await this.getCharacters();
    const needle = query.search ? normalizeText(query.search) : '';
    let list = all;

    if (needle) {
      list = list.filter((character) =>
        relevance(
          [
            character.name,
            character.job,
            character.crew?.name,
            character.crew?.romanName,
            character.fruit?.name,
          ],
          needle,
        ) > 0,
      );
    }

    if (query.crew !== undefined) {
      list = list.filter((character) => character.crew?.id === query.crew);
    }

    if (query.status !== undefined) {
      list = list.filter((character) => character.status === query.status);
    }

    if (query.hasBounty === true) {
      list = list.filter((character) => character.bounty !== null);
    }

    const sort = query.sort ?? 'bounty_desc';
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'bounty_asc':
          return bountyOf(a) - bountyOf(b) || byName(a, b);
        case 'name_asc':
          return byName(a, b);
        case 'name_desc':
          return byName(b, a);
        case 'id_asc':
          return a.id - b.id;
        case 'bounty_desc':
        default:
          return bountyOf(b) - bountyOf(a) || byName(a, b);
      }
    });

    return paginate(list, query.page, query.limit);
  }

  async getCharacter(id: number): Promise<Character> {
    const all = await this.getCharacters();
    const character = all.find((item) => item.id === id);
    if (!character) throw new NotFoundError(`No existe el personaje ${id}.`);
    return character;
  }

  async listFruits(query: FruitQuery): Promise<Paginated<Fruit>> {
    const all = await this.getFruits();
    const needle = query.search ? normalizeText(query.search) : '';
    let list = all;

    if (needle) {
      list = list.filter(
        (fruit) =>
          relevance([fruit.name, fruit.romanName, fruit.type, fruit.description], needle) > 0,
      );
    }

    if (query.type) {
      const type = normalizeText(query.type);
      list = list.filter((fruit) => normalizeText(fruit.type ?? '') === type);
    }

    list = [...list].sort((a, b) => {
      switch (query.sort ?? 'name_asc') {
        case 'name_desc':
          return byName(b, a);
        case 'id_asc':
          return a.id - b.id;
        case 'name_asc':
        default:
          return byName(a, b);
      }
    });

    return paginate(list, query.page, query.limit);
  }

  async getFruit(id: number): Promise<Fruit> {
    const all = await this.getFruits();
    const fruit = all.find((item) => item.id === id);
    if (!fruit) throw new NotFoundError(`No existe la fruta ${id}.`);
    return fruit;
  }

  async listCrews(query: CrewQuery): Promise<Paginated<Crew>> {
    const all = await this.getCrews();
    const needle = query.search ? normalizeText(query.search) : '';
    let list = all;

    if (needle) {
      list = list.filter(
        (crew) => relevance([crew.name, crew.romanName, crew.description], needle) > 0,
      );
    }

    if (query.status) {
      list = list.filter((crew) => crew.status === query.status);
    }

    list = [...list].sort((a, b) => {
      switch (query.sort ?? 'bounty_desc') {
        case 'bounty_asc':
          return totalBountyOf(a) - totalBountyOf(b) || byName(a, b);
        case 'name_asc':
          return byName(a, b);
        case 'name_desc':
          return byName(b, a);
        case 'bounty_desc':
        default:
          return totalBountyOf(b) - totalBountyOf(a) || byName(a, b);
      }
    });

    return paginate(list, query.page, query.limit);
  }

  async getCrew(id: number): Promise<CrewDetail> {
    const [crews, characters] = await Promise.all([this.getCrews(), this.getCharacters()]);
    const crew = crews.find((item) => item.id === id);
    if (!crew) throw new NotFoundError(`No existe la tripulación ${id}.`);

    const members = characters
      .filter((character) => character.crew?.id === crew.id)
      .sort((a, b) => bountyOf(b) - bountyOf(a) || byName(a, b));

    const captain =
      members.find((member) => /captain|capit[aá]n|comandante/i.test(member.job ?? '')) ??
      null;

    return {
      ...crew,
      captain: captain
        ? { id: captain.id, name: captain.name, romanName: null }
        : null,
      members,
    };
  }

  async listArcs(query: ArcQuery): Promise<Paginated<Arc>> {
    const all = await this.getArcs();
    const needle = query.search ? normalizeText(query.search) : '';
    let list = all;

    if (needle) {
      list = list.filter(
        (arc) =>
          relevance([arc.title, arc.description, arc.saga?.title], needle) > 0,
      );
    }

    if (query.saga !== undefined) {
      list = list.filter((arc) => arc.saga?.id === query.saga);
    }

    list = [...list].sort((a, b) => a.id - b.id);
    return paginate(list, query.page, query.limit);
  }

  async getArc(id: number): Promise<Arc> {
    const all = await this.getArcs();
    const arc = all.find((item) => item.id === id);
    if (!arc) throw new NotFoundError(`No existe el arco ${id}.`);
    return arc;
  }

  async listSagas(): Promise<Saga[]> {
    const all = await this.getSagas();
    return [...all].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }

  async listBoats(query: BoatQuery): Promise<Paginated<Boat>> {
    const all = await this.getBoats();
    const needle = query.search ? normalizeText(query.search) : '';
    let list = all;

    if (needle) {
      list = list.filter(
        (boat) =>
          relevance(
            [boat.name, boat.romanName, boat.type, boat.crew?.name, boat.captain?.name],
            needle,
          ) > 0,
      );
    }

    if (query.crew !== undefined) {
      list = list.filter((boat) => boat.crew?.id === query.crew);
    }

    list = [...list].sort((a, b) => {
      switch (query.sort ?? 'name_asc') {
        case 'name_desc':
          return byName(b, a);
        case 'id_asc':
          return a.id - b.id;
        case 'name_asc':
        default:
          return byName(a, b);
      }
    });

    return paginate(list, query.page, query.limit);
  }

  async getBoat(id: number): Promise<Boat> {
    const all = await this.getBoats();
    const boat = all.find((item) => item.id === id);
    if (!boat) throw new NotFoundError(`No existe el barco ${id}.`);
    return boat;
  }

  async search(rawQuery: string, limitPerCategory = 5): Promise<GlobalSearchResults> {
    const needle = normalizeText(rawQuery);
    const [characters, fruits, crews, boats, arcs] = await Promise.all([
      this.getCharacters(),
      this.getFruits(),
      this.getCrews(),
      this.getBoats(),
      this.getArcs(),
    ]);

    const rank = <T>(
      items: T[],
      fields: (item: T) => Array<string | null | undefined>,
      tieBreak: (a: T, b: T) => number = () => 0,
    ) => {
      return items
        .map((item) => ({ item, score: relevance(fields(item), needle) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || tieBreak(a.item, b.item))
        .map((entry) => entry.item);
    };

    const rankedCharacters = rank(
      characters,
      (character) => [
        character.name,
        character.job,
        character.crew?.name,
        character.crew?.romanName,
        character.fruit?.name,
      ],
      (a, b) => bountyOf(b) - bountyOf(a) || byName(a, b),
    );
    const rankedFruits = rank(
      fruits,
      (fruit) => [fruit.name, fruit.romanName, fruit.type, fruit.description],
      byName,
    );
    const rankedCrews = rank(
      crews,
      (crew) => [crew.name, crew.romanName, crew.description],
      (a, b) => totalBountyOf(b) - totalBountyOf(a) || byName(a, b),
    );
    const rankedBoats = rank(
      boats,
      (boat) => [boat.name, boat.romanName, boat.type, boat.crew?.name, boat.captain?.name],
      byName,
    );
    const rankedArcs = rank(
      arcs,
      (arc) => [arc.title, arc.description, arc.saga?.title],
      (a, b) => a.id - b.id,
    );

    const group = <T>(items: T[]): SearchGroup<T> => ({
      items: items.slice(0, limitPerCategory),
      total: items.length,
    });

    const groups = {
      characters: group(rankedCharacters),
      fruits: group(rankedFruits),
      crews: group(rankedCrews),
      boats: group(rankedBoats),
      arcs: group(rankedArcs),
    };

    return {
      query: rawQuery,
      total:
        groups.characters.total +
        groups.fruits.total +
        groups.crews.total +
        groups.boats.total +
        groups.arcs.total,
      groups,
    };
  }

  /** Opciones ligeras para los filtros del frontend. */
  async getFilters() {
    const [crews, fruits, sagas] = await Promise.all([
      this.getCrews(),
      this.getFruits(),
      this.getSagas(),
    ]);

    return {
      crews: [...crews]
        .sort((a, b) => byName(a, b))
        .map((crew) => ({ id: crew.id, name: crew.name })),
      fruitTypes: [...new Set(fruits.map((fruit) => fruit.type).filter(Boolean))]
        .map((type) => type as string)
        .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })),
      sagas: [...sagas]
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .map((saga) => ({ id: saga.id, title: saga.title })),
    };
  }

  async getStats() {
    const [characters, fruits, crews, boats, arcs, sagas] = await Promise.all([
      this.getCharacters(),
      this.getFruits(),
      this.getCrews(),
      this.getBoats(),
      this.getArcs(),
      this.getSagas(),
    ]);

    const withBounty = characters
      .filter((character) => character.bounty !== null)
      .sort((a, b) => bountyOf(b) - bountyOf(a));

    const fruitTypes = [...new Set(fruits.map((fruit) => fruit.type).filter(Boolean))]
      .sort((a, b) => (a ?? '').localeCompare(b ?? ''));

    const strongestCrew = [...crews].sort(
      (a, b) => totalBountyOf(b) - totalBountyOf(a),
    )[0] ?? null;

    return {
      counts: {
        characters: characters.length,
        fruits: fruits.length,
        crews: crews.length,
        boats: boats.length,
        arcs: arcs.length,
        sagas: sagas.length,
        charactersWithBounty: withBounty.length,
        charactersWithImage: characters.filter((character) => character.image !== null).length,
        fruitsWithImage: fruits.filter((fruit) => fruit.image !== null).length,
        boatsWithImage: boats.filter((boat) => boat.image !== null).length,
      },
      featuredCharacters: withBounty.slice(0, 6),
      topBounties: withBounty.slice(0, 5),
      featuredFruits: fruits.filter((fruit) => fruit.image !== null).slice(0, 6),
      strongestCrew,
      latestArcs: [...arcs].sort((a, b) => b.id - a.id).slice(0, 4),
      fruitTypes,
    };
  }

  getMeta() {
    const imageProvider = this.provider.imageProvider ?? null;

    return {
      provider: {
        key: this.provider.key,
        label: this.provider.label,
        capabilities: this.provider.capabilities,
        limitations: this.provider.limitations,
      },
      imageProvider: imageProvider
        ? {
            key: imageProvider.key,
            label: imageProvider.label,
            capabilities: imageProvider.capabilities,
            limitations: imageProvider.limitations,
          }
        : null,
      locale: {
        code: 'es',
        contentLanguage: 'en/fr',
        note: 'La interfaz está en español; las APIs externas ofrecen contenido en inglés y francés.',
      },
      externalApi: {
        name: 'api-onepiece.com',
        version: 'v2',
        documentationStatus: 'La URL pública de documentación devuelve 404.',
        role: 'Datos base: personajes, frutas, tripulaciones, sagas, arcos y barcos.',
        endpoints: [
          '/v2/characters/:locale',
          '/v2/fruits/:locale',
          '/v2/crews/:locale',
          '/v2/sagas/:locale',
          '/v2/arcs/:locale',
          '/v2/boats/:locale',
        ],
      },
      externalApis: [
        {
          name: 'api-onepiece.com',
          version: 'v2',
          role: 'Datos base',
          documentation: null,
          license: null,
          endpoints: [
            '/v2/characters/:locale',
            '/v2/fruits/:locale',
            '/v2/crews/:locale',
            '/v2/sagas/:locale',
            '/v2/arcs/:locale',
            '/v2/boats/:locale',
          ],
        },
        ...(imageProvider
          ? [
              {
                name: 'onepieceapi.com',
                version: 'v1',
                role: 'Imágenes y datos complementarios',
                documentation: 'https://onepieceapi.com/documentation',
                license: 'MIT',
                endpoints: [
                  '/api/characters',
                  '/api/devil-fruits',
                  '/api/ships',
                  '/api/bounties',
                ],
              },
            ]
          : []),
      ],
    };
  }
}
