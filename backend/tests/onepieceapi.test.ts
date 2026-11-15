import { describe, expect, it } from 'vitest';
import type { Boat, Character, Fruit } from '../src/types/domain';
import {
  isGenericFruitImage,
  mapEnrichmentCharacter,
  mapEnrichmentFruit,
  mapEnrichmentShip,
} from '../src/providers/onepieceapi/mappers';
import {
  matchCharacters,
  matchFruits,
  matchShips,
  normalizeName,
} from '../src/providers/multisource/matcher';

const HOST = 'https://hlryizauzapedkefdviw.supabase.co/storage/v1/object/public';

function character(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Monkey D. Luffy',
    job: 'Captain',
    status: 'alive',
    age: '19 años',
    height: '174 cm',
    bounty: {
      amount: 3_000_000_000,
      raw: '3.000.000.000',
      formatted: '฿ 3.000.000.000',
    },
    crew: { id: 1, name: 'Straw Hat Pirates' },
    fruit: null,
    image: null,
    ...overrides,
  };
}

function fruit(overrides: Partial<Fruit> = {}): Fruit {
  return {
    id: 1,
    name: 'Gum-Gum Fruit',
    romanName: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    description: null,
    image: null,
    ...overrides,
  };
}

function boat(overrides: Partial<Boat> = {}): Boat {
  return {
    id: 1,
    name: 'Vogue Merry',
    romanName: 'Gōingu Merī-gō',
    type: 'Pirate ship',
    description: null,
    crew: null,
    captain: null,
    image: null,
    ...overrides,
  };
}

describe('mappers de onepieceapi', () => {
  it('normaliza personaje, recompensa activa y estado', () => {
    const mapped = mapEnrichmentCharacter({
      id: 'uuid-luffy',
      name: { en: 'Monkey D. Luffy', romaji: 'Monkī Dī Rufi' },
      age: 19,
      status: 'Alive',
      image_url: `${HOST}/characters/monkey-d-luffy.webp`,
      bounties: [
        { amount: 400_000_000, is_active: false },
        { amount: 3_000_000_000, is_active: true },
      ],
    });

    expect(mapped).toMatchObject({
      id: 'uuid-luffy',
      age: 19,
      status: 'alive',
      bounty: 3_000_000_000,
      image: `${HOST}/characters/monkey-d-luffy.webp`,
    });
    expect(mapped.names).toEqual(['Monkey D. Luffy', 'Monkī Dī Rufi']);
  });

  it('descarta las ilustraciones genéricas de frutas', () => {
    const generic = mapEnrichmentFruit({
      id: 'g',
      type: 'Paramecia',
      name: { en: 'Soul-Soul Fruit', romaji: 'Soru Soru no Mi' },
      image_url: `${HOST}/devil-fruits/fruit/generic-paramecia.webp`,
    });
    const specific = mapEnrichmentFruit({
      id: 's',
      type: 'Paramecia',
      name: { en: 'Gum-Gum Fruit', romaji: 'Gomu Gomu no Mi' },
      image_url: `${HOST}/devil-fruits/fruit/gomu-gomu-no-mi.webp`,
    });

    expect(isGenericFruitImage(generic.image)).toBe(false);
    expect(generic.image).toBeNull();
    expect(specific.image).toContain('gomu-gomu-no-mi.webp');
  });

  it('normaliza nombres de barcos', () => {
    const mapped = mapEnrichmentShip({
      id: 'uuid-merry',
      name: { en: 'Going Merry', romaji: 'Gōingu Merī-gō' },
      image_url: `${HOST}/ships/going-merry.webp`,
    });

    expect(mapped.names).toEqual(['Going Merry', 'Gōingu Merī-gō']);
    expect(mapped.image).toContain('going-merry.webp');
  });
});

describe('correspondencia de personajes', () => {
  const catalog = [
    {
      id: 'luffy',
      names: ['Monkey D. Luffy', 'Monkī Dī Rufi'],
      image: `${HOST}/characters/monkey-d-luffy.webp`,
      age: 19,
      status: 'alive' as const,
      bounty: 3_000_000_000,
    },
    {
      id: 'ace-a',
      names: ['Portgas D. Ace'],
      image: `${HOST}/characters/ace-a.webp`,
      age: 20,
      status: 'deceased' as const,
      bounty: null,
    },
    {
      id: 'ace-b',
      names: ['Portgas D. Ace'],
      image: `${HOST}/characters/ace-b.webp`,
      age: 20,
      status: 'deceased' as const,
      bounty: null,
    },
  ];

  it('normaliza acentos, puntos y mayúsculas', () => {
    expect(normalizeName('Monkey D. Luffy')).toBe('monkey d luffy');
    expect(normalizeName('Monkī Dī Rufi')).toBe('monki di rufi');
  });

  it('asocia nombres únicos y rellena datos ausentes', () => {
    const matches = matchCharacters([character()], catalog);
    const match = matches.get(1);
    expect(match?.record.id).toBe('luffy');
    expect(match?.strategy).toBe('name');
    expect(match?.image).toContain('monkey-d-luffy.webp');
  });

  it('rechaza duplicados con imágenes distintas si no hay verificación', () => {
    const matches = matchCharacters(
      [character({ id: 2, name: 'Portgas D. Ace', age: null, bounty: null, status: null })],
      catalog,
    );
    expect(matches.has(2)).toBe(false);
  });

  it('acepta duplicados solo cuando comparten la misma imagen', () => {
    const sameImage = catalog.map((entry) =>
      entry.id.startsWith('ace') ? { ...entry, image: `${HOST}/characters/ace.webp` } : entry,
    );
    const matches = matchCharacters(
      [character({ id: 3, name: 'Portgas D. Ace', age: null, bounty: null, status: null })],
      sameImage,
    );
    expect(matches.get(3)?.strategy).toBe('name-shared-image');
    expect(matches.get(3)?.image).toContain('ace.webp');
  });

  it('verifica duplicados por recompensa, edad y estado cuando es único', () => {
    const distinct = [
      { ...catalog[1]!, id: 'ace-a', bounty: 550_000_000 },
      { ...catalog[2]!, id: 'ace-b', age: 22, status: 'alive' as const },
    ];
    const matches = matchCharacters(
      [
        character({
          id: 4,
          name: 'Portgas D. Ace',
          age: '20 años',
          status: 'deceased',
          bounty: {
            amount: 550_000_000,
            raw: '550.000.000',
            formatted: '฿ 550.000.000',
          },
        }),
      ],
      distinct,
    );
    expect(matches.get(4)?.record.id).toBe('ace-a');
    expect(matches.get(4)?.strategy).toBe('verified');
  });
});

describe('correspondencia de frutas y barcos', () => {
  const specificFruit = {
    id: 'gomu',
    name: 'Gum-Gum Fruit',
    romanName: 'Gomu Gomu no Mi',
    model: null,
    modelRomanName: null,
    image: `${HOST}/devil-fruits/fruit/gomu-gomu-no-mi.webp`,
  };

  it('usa el nombre romanizado y descarta catálogos sin arte específico', () => {
    const matches = matchFruits([fruit()], [specificFruit]);
    expect(matches.get(1)?.strategy).toBe('roman-name');
    expect(matches.get(1)?.image).toContain('gomu-gomu-no-mi.webp');

    const genericOnly = matchFruits([fruit({ id: 2 })], [
      { ...specificFruit, id: 'generic', image: null },
    ]);
    expect(genericOnly.has(2)).toBe(false);
  });

  it('desambigua frutas con la misma base mediante el modelo', () => {
    const hito = [
      {
        id: 'buddha',
        name: 'Human-Human Fruit',
        romanName: 'Hito Hito no Mi',
        model: 'Buddha',
        modelRomanName: 'Daibutsu',
        image: `${HOST}/devil-fruits/fruit/hito-hito-no-mi.webp`,
      },
      {
        id: 'nika',
        name: 'Human-Human Fruit',
        romanName: 'Hito Hito no Mi',
        model: 'Nika',
        modelRomanName: 'Nika',
        image: `${HOST}/devil-fruits/fruit/hito-hito-no-mi-nika.webp`,
      },
    ];

    const matches = matchFruits(
      [
        fruit({
          id: 196,
          name: 'Hito Hito no Mi, Nika model',
          romanName: 'Hito Hito no Mi, Moderu: Nika',
        }),
        fruit({
          id: 121,
          name: 'Fruit of the Human, Buddha version',
          romanName: 'Hito Hito no Mi moderu Daibutsu',
        }),
      ],
      hito,
    );

    expect(matches.get(196)?.record.id).toBe('nika');
    expect(matches.get(121)?.record.id).toBe('buddha');
    expect(matches.get(196)?.strategy).toBe('name-model');
  });

  it('empareja barcos por nombre romanizado', () => {
    const matches = matchShips([boat()], [
      {
        id: 'merry',
        names: ['Going Merry', 'Gōingu Merī-gō'],
        image: `${HOST}/ships/going-merry.webp`,
      },
    ]);
    expect(matches.get(1)?.strategy).toBe('roman-name');
    expect(matches.get(1)?.record.id).toBe('merry');
  });
});
