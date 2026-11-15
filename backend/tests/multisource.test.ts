import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type {
  Arc,
  Boat,
  Character,
  Crew,
  Fruit,
  Saga,
} from '../src/types/domain';
import type {
  DataProvider,
  ImageEnrichmentSource,
} from '../src/providers/provider.interface';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
} from '../src/providers/onepieceapi/types';
import { MultisourceProvider } from '../src/providers/multisource/provider';
import { createApp } from '../src/app';

const HOST = 'https://hlryizauzapedkefdviw.supabase.co/storage/v1/object/public';

const primaryCharacters: Character[] = [
  {
    id: 1,
    name: 'Monkey D. Luffy',
    job: 'Captain',
    status: null,
    age: null,
    height: null,
    bounty: null,
    crew: { id: 1, name: 'Straw Hat Pirates' },
    fruit: { id: 1, name: 'Gum-Gum Fruit', type: 'Paramecia' },
    image: null,
  },
  {
    id: 2,
    name: 'Roronoa Zoro',
    job: 'Swordsman',
    status: 'alive',
    age: '21 años',
    height: '181 cm',
    bounty: {
      amount: 1_101_000_000,
      raw: '1.101.000.000',
      formatted: '฿ 1.101.000.000',
    },
    crew: { id: 1, name: 'Straw Hat Pirates' },
    fruit: null,
    image: null,
  },
  {
    id: 3,
    name: 'Portgas D. Ace',
    job: 'Commander',
    status: null,
    age: null,
    height: null,
    bounty: null,
    crew: { id: 2, name: 'Whitebeard Pirates' },
    fruit: null,
    image: null,
  },
  {
    id: 4,
    name: 'Nami',
    job: 'Navigator',
    status: 'alive',
    age: null,
    height: null,
    bounty: null,
    crew: { id: 1, name: 'Straw Hat Pirates' },
    fruit: null,
    image: null,
  },
];

const primaryFruits: Fruit[] = [
  {
    id: 1,
    name: 'Gum-Gum Fruit',
    romanName: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    description: null,
    image: null,
  },
  {
    id: 2,
    name: 'Fruit of Fragmentation',
    romanName: 'Bara Bara no Mi',
    type: 'Paramecia',
    description: null,
    image: 'https://images.api-onepiece.com/fruits/bara.png',
  },
  {
    id: 3,
    name: 'Human-Human Fruit',
    romanName: 'Hito Hito no Mi',
    type: 'Zoan',
    description: null,
    image: 'https://images.api-onepiece.com/fruits/hito.png',
  },
];

const primaryBoats: Boat[] = [
  {
    id: 1,
    name: 'Vogue Merry',
    romanName: 'Gōingu Merī-gō',
    type: 'Pirate ship',
    description: null,
    crew: { id: 1, name: 'Straw Hat Pirates' },
    captain: { id: 1, name: 'Monkey D. Luffy' },
    image: null,
  },
  {
    id: 2,
    name: 'Thousand Sunny',
    romanName: 'Sauzando Sanī-gō',
    type: 'Pirate ship',
    description: null,
    crew: { id: 1, name: 'Straw Hat Pirates' },
    captain: { id: 1, name: 'Monkey D. Luffy' },
    image: null,
  },
];

const crews: Crew[] = [
  {
    id: 1,
    name: 'Straw Hat Pirates',
    romanName: 'Mugiwara no Ichimi',
    description: null,
    status: 'active',
    memberCount: 10,
    totalBounty: null,
    isYonko: true,
  },
  {
    id: 2,
    name: 'Whitebeard Pirates',
    romanName: null,
    description: null,
    status: 'dissolved',
    memberCount: null,
    totalBounty: null,
    isYonko: true,
  },
];

const sagas: Saga[] = [
  {
    id: 1,
    title: 'East Blue',
    number: 1,
    chapters: null,
    volumes: null,
    episodes: null,
  },
];

const arcs: Arc[] = [
  { id: 1, title: 'Romance Dawn', description: null, saga: sagas[0]! },
];

class StaticProvider implements DataProvider {
  readonly key = 'onepiece_v2';
  readonly label = 'Proveedor base de pruebas';
  readonly limitations = ['Datos de prueba'];
  readonly capabilities = {
    remoteSearch: false,
    remotePagination: false,
    images: {
      characters: false,
      fruits: true,
      crews: false,
      boats: false,
      arcs: false,
    },
  } as const;

  async getCharacters() {
    return primaryCharacters;
  }
  async getFruits() {
    return primaryFruits;
  }
  async getCrews() {
    return crews;
  }
  async getSagas() {
    return sagas;
  }
  async getArcs() {
    return arcs;
  }
  async getBoats() {
    return primaryBoats;
  }
}

class StubEnrichment implements ImageEnrichmentSource {
  readonly key = 'onepieceapi';
  readonly label = 'Fuente de imágenes de pruebas';
  readonly limitations = ['Datos de prueba'];
  readonly capabilities = {
    remoteSearch: false,
    remotePagination: true,
    images: {
      characters: true,
      fruits: true,
      crews: false,
      boats: true,
      arcs: false,
    },
  } as const;

  constructor(private readonly shouldFail = false) {}

  private assertAvailable() {
    if (this.shouldFail) throw new Error('Fuente de imágenes caída');
  }

  async getCharacterCatalog(): Promise<EnrichmentCharacter[]> {
    this.assertAvailable();
    return [
      {
        id: 'luffy',
        names: ['Monkey D. Luffy'],
        image: `${HOST}/characters/monkey-d-luffy.webp`,
        age: 19,
        status: 'alive',
        bounty: 3_000_000_000,
      },
      {
        id: 'zoro',
        names: ['Roronoa Zoro'],
        image: `${HOST}/characters/roronoa-zoro.webp`,
        age: 99,
        status: 'deceased',
        bounty: 1,
      },
      {
        id: 'ace-a',
        names: ['Portgas D. Ace'],
        image: `${HOST}/characters/ace-a.webp`,
        age: null,
        status: null,
        bounty: null,
      },
      {
        id: 'ace-b',
        names: ['Portgas D. Ace'],
        image: `${HOST}/characters/ace-b.webp`,
        age: null,
        status: null,
        bounty: null,
      },
      {
        id: 'nami',
        names: ['Nami'],
        image: `${HOST}/characters/nami.webp`,
        age: 20,
        status: 'alive',
        bounty: null,
      },
    ];
  }

  async getFruitCatalog(): Promise<EnrichmentFruit[]> {
    this.assertAvailable();
    return [
      {
        id: 'gomu',
        name: 'Gum-Gum Fruit',
        romanName: 'Gomu Gomu no Mi',
        model: null,
        modelRomanName: null,
        image: `${HOST}/devil-fruits/fruit/gomu-gomu-no-mi.webp`,
      },
      {
        id: 'bara',
        name: 'Fruit of Fragmentation',
        romanName: 'Bara Bara no Mi',
        model: null,
        modelRomanName: null,
        image: `${HOST}/devil-fruits/fruit/bara-bara-no-mi.webp`,
      },
    ];
  }

  async getShipCatalog(): Promise<EnrichmentShip[]> {
    this.assertAvailable();
    return [
      {
        id: 'merry',
        names: ['Going Merry', 'Gōingu Merī-gō'],
        image: `${HOST}/ships/going-merry.webp`,
      },
      {
        id: 'sunny',
        names: ['Thousand Sunny', 'Sauzando Sanī-gō'],
        image: `${HOST}/ships/thousand-sunny.webp`,
      },
    ];
  }
}

function createMultisource(fail = false) {
  return new MultisourceProvider(new StaticProvider(), new StubEnrichment(fail));
}

describe('proveedor multifuente', () => {
  it('combina datos e imágenes y solo rellena huecos', async () => {
    const characters = await createMultisource().getCharacters();
    const luffy = characters.find((item) => item.name === 'Monkey D. Luffy')!;
    const zoro = characters.find((item) => item.name === 'Roronoa Zoro')!;

    expect(luffy.image).toContain('monkey-d-luffy.webp');
    expect(luffy.age).toBe('19 años');
    expect(luffy.status).toBe('alive');
    expect(luffy.bounty?.amount).toBe(3_000_000_000);
    expect(luffy.source).toEqual({
      data: 'onepiece_v2',
      image: 'onepieceapi',
      match: 'name',
    });

    expect(zoro.age).toBe('21 años');
    expect(zoro.status).toBe('alive');
    expect(zoro.bounty?.amount).toBe(1_101_000_000);
    expect(zoro.image).toContain('roronoa-zoro.webp');
  });

  it('no asocia imágenes cuando el nombre es ambiguo', async () => {
    const characters = await createMultisource().getCharacters();
    const ace = characters.find((item) => item.name === 'Portgas D. Ace')!;

    expect(ace.image).toBeNull();
    expect(ace.source).toEqual({
      data: 'onepiece_v2',
      image: null,
      match: null,
    });
  });

  it('prefiere arte específico nuevo y conserva la imagen anterior si no hay coincidencia', async () => {
    const fruits = await createMultisource().getFruits();
    const gomu = fruits.find((item) => item.name === 'Gum-Gum Fruit')!;
    const bara = fruits.find((item) => item.name === 'Fruit of Fragmentation')!;
    const hito = fruits.find((item) => item.name === 'Human-Human Fruit')!;

    expect(gomu.image).toContain('gomu-gomu-no-mi.webp');
    expect(bara.image).toContain('bara-bara-no-mi.webp');
    expect(hito.image).toBe('https://images.api-onepiece.com/fruits/hito.png');
    expect(hito.source).toEqual({
      data: 'onepiece_v2',
      image: 'onepiece_v2',
      match: null,
    });
  });

  it('empareja barcos por nombre romanizado o exacto', async () => {
    const boats = await createMultisource().getBoats();
    const merry = boats.find((item) => item.name === 'Vogue Merry')!;
    const sunny = boats.find((item) => item.name === 'Thousand Sunny')!;

    expect(merry.image).toContain('going-merry.webp');
    expect(merry.source?.match).toBe('roman-name');
    expect(sunny.image).toContain('thousand-sunny.webp');
    expect(sunny.source?.match).toBe('name');
  });

  it('no bloquea los datos base si la fuente de imágenes tarda', async () => {
    class SlowEnrichment extends StubEnrichment {
      override async getCharacterCatalog(): Promise<EnrichmentCharacter[]> {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return super.getCharacterCatalog();
      }
    }

    const provider = new MultisourceProvider(
      new StaticProvider(),
      new SlowEnrichment(),
      { enrichmentWaitMs: 20 },
    );

    const startedAt = Date.now();
    const characters = await provider.getCharacters();
    const elapsed = Date.now() - startedAt;

    expect(elapsed).toBeLessThan(120);
    expect(characters.find((item) => item.name === 'Monkey D. Luffy')?.image).toBeNull();
    expect(characters[0]?.source?.data).toBe('onepiece_v2');
  });

  it('no cachea la respuesta provisional y se enriquece en la siguiente petición', async () => {
    class SlowCachedEnrichment extends StubEnrichment {
      private cached: Promise<EnrichmentCharacter[]> | null = null;

      override getCharacterCatalog(): Promise<EnrichmentCharacter[]> {
        this.cached ??= (async () => {
          await new Promise((resolve) => setTimeout(resolve, 80));
          return super.getCharacterCatalog();
        })();
        return this.cached;
      }
    }

    const provider = new MultisourceProvider(
      new StaticProvider(),
      new SlowCachedEnrichment(),
      { enrichmentWaitMs: 10 },
    );
    const app = createApp({ provider, cacheTtlMs: 60_000 });

    const first = await request(app).get('/api/characters');
    const firstLuffy = first.body.data.find(
      (item: { name: string }) => item.name === 'Monkey D. Luffy',
    );
    expect(firstLuffy.image).toBeNull();
    expect(provider.isEnrichmentPending('characters')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const second = await request(app).get('/api/characters');
    const secondLuffy = second.body.data.find(
      (item: { name: string }) => item.name === 'Monkey D. Luffy',
    );
    expect(secondLuffy.image).toMatch(/^\/api\/media\?src=/);
    expect(provider.isEnrichmentPending('characters')).toBe(false);
  });

  it('degrada con elegancia si la fuente de imágenes falla', async () => {
    const provider = createMultisource(true);
    const [characters, fruits, boats] = await Promise.all([
      provider.getCharacters(),
      provider.getFruits(),
      provider.getBoats(),
    ]);

    expect(characters.find((item) => item.name === 'Monkey D. Luffy')?.image).toBeNull();
    expect(fruits.find((item) => item.name === 'Gum-Gum Fruit')?.image).toBeNull();
    expect(boats.find((item) => item.name === 'Vogue Merry')?.image).toBeNull();
    expect(characters[0]?.source?.data).toBe('onepiece_v2');
  });
});

describe('API con proveedor multifuente', () => {
  const app = createApp({ provider: createMultisource(), cacheTtlMs: 0 });

  it('proxifica las imágenes de personajes y expone la procedencia', async () => {
    const response = await request(app).get('/api/characters');
    expect(response.status).toBe(200);

    const luffy = response.body.data.find(
      (item: { name: string }) => item.name === 'Monkey D. Luffy',
    );
    expect(luffy.image).toMatch(/^\/api\/media\?src=/);
    expect(luffy.source.image).toBe('onepieceapi');
  });

  it('proxifica imágenes en barcos, integrantes, buscador y estadísticas', async () => {
    const boats = await request(app).get('/api/boats?crew=1');
    expect(boats.body.data[0].image).toMatch(/^\/api\/media\?src=/);

    const crew = await request(app).get('/api/crews/1');
    expect(
      crew.body.data.members.find(
        (item: { name: string }) => item.name === 'Monkey D. Luffy',
      ).image,
    ).toMatch(/^\/api\/media\?src=/);

    const search = await request(app).get('/api/search?q=luffy');
    expect(search.body.data.groups.characters.items[0].image).toMatch(
      /^\/api\/media\?src=/,
    );

    const stats = await request(app).get('/api/stats');
    expect(stats.body.data.featuredCharacters[0].image).toMatch(/^\/api\/media\?src=/);
    expect(stats.body.data.counts.charactersWithImage).toBeGreaterThan(0);
  });

  it('publica la fuente de imágenes en /api/meta', async () => {
    const response = await request(app).get('/api/meta');
    expect(response.status).toBe(200);
    expect(response.body.data.provider.key).toBe('onepiece_multisource');
    expect(response.body.data.imageProvider.key).toBe('onepieceapi');
    expect(response.body.data.externalApis).toHaveLength(2);
  });
});
