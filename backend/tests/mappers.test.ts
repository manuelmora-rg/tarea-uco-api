import { describe, expect, it } from 'vitest';
import {
  cleanText,
  mapArc,
  mapBoat,
  mapCharacter,
  mapCrew,
  mapFruit,
  mapSaga,
  normalizeAge,
  normalizeMeasure,
  parseBounty,
} from '../src/providers/onepiece-v2/mappers';
import type {
  RawArc,
  RawBoat,
  RawCharacter,
  RawCrew,
  RawFruit,
  RawSaga,
} from '../src/providers/onepiece-v2/mappers';

describe('parseBounty', () => {
  it('convierte el formato con puntos de miles', () => {
    expect(parseBounty('3.000.000.000')?.amount).toBe(3_000_000_000);
    expect(parseBounty('1.101.000.000')?.amount).toBe(1_101_000_000);
    expect(parseBounty('1000')?.amount).toBe(1000);
  });

  it('corrige el agrupamiento erróneo de cuatro ceros sin alterar la cifra', () => {
    expect(parseBounty('67.0000.000')?.amount).toBe(67_000_000);
    expect(parseBounty('15.0000.000')?.amount).toBe(15_000_000);
  });

  it('conserva el valor original en raw', () => {
    expect(parseBounty('67.0000.000')?.raw).toBe('67.0000.000');
  });

  it('devuelve null para valores vacíos o inválidos', () => {
    expect(parseBounty('')).toBeNull();
    expect(parseBounty(null)).toBeNull();
    expect(parseBounty('-')).toBeNull();
    expect(parseBounty('desconocida')).toBeNull();
    expect(parseBounty('0')).toBeNull();
  });
});

describe('normalización de medidas y edades', () => {
  it('separa la unidad y elimina espacios internos', () => {
    expect(normalizeMeasure('2 200cm')).toBe('2200 cm');
    expect(normalizeMeasure('174cm')).toBe('174 cm');
    expect(normalizeMeasure('35km')).toBe('35 km');
    expect(normalizeMeasure('')).toBeNull();
  });

  it('traduce el sufijo francés de edad', () => {
    expect(normalizeAge('19 ans')).toBe('19 años');
    expect(normalizeAge('-')).toBeNull();
  });

  it('descarta valores vacíos', () => {
    expect(cleanText('  ')).toBeNull();
    expect(cleanText('?')).toBeNull();
    expect(cleanText('Luffy')).toBe('Luffy');
  });
});

describe('mapCharacter', () => {
  const raw: RawCharacter = {
    id: 1,
    name: 'Monkey D Luffy',
    size: '174cm',
    age: '19 ans',
    bounty: '3.000.000.000',
    crew: { id: 1, name: 'The Chapeau de Paille crew', roman_name: 'Mugiwara no Ichimi' },
    fruit: { id: 196, name: 'Hito Hito no Mi', type: 'Zoan Mythique' },
    job: 'Captain',
    status: 'vivant',
  };

  it('normaliza los campos conocidos', () => {
    const character = mapCharacter(raw);
    expect(character.name).toBe('Monkey D Luffy');
    expect(character.status).toBe('alive');
    expect(character.age).toBe('19 años');
    expect(character.height).toBe('174 cm');
    expect(character.bounty?.amount).toBe(3_000_000_000);
    expect(character.crew?.id).toBe(1);
    expect(character.fruit?.type).toBe('Zoan Mythique');
    expect(character.image).toBeNull();
  });

  it('no inventa datos ausentes', () => {
    const character = mapCharacter({ id: 99, name: 'Desconocido' });
    expect(character.job).toBeNull();
    expect(character.status).toBeNull();
    expect(character.bounty).toBeNull();
    expect(character.crew).toBeNull();
    expect(character.fruit).toBeNull();
    expect(character.image).toBeNull();
  });

  it('mapea estados muertos y desconocidos', () => {
    expect(mapCharacter({ id: 3, name: 'X', status: 'deceased' }).status).toBe('deceased');
    expect(mapCharacter({ id: 4, name: 'X', status: 'raro' }).status).toBe('unknown');
  });
});

describe('mapFruit', () => {
  it('usa filename y recurre a technicalFile', () => {
    const base: RawFruit = { id: 1, name: 'Gomu Gomu no Mi' };
    expect(
      mapFruit({ ...base, filename: 'https://images.api-onepiece.com/a.png' }).image,
    ).toBe('https://images.api-onepiece.com/a.png');
    expect(
      mapFruit({ ...base, technicalFile: 'https://images.api-onepiece.com/b.jpg' }).image,
    ).toBe('https://images.api-onepiece.com/b.jpg');
    expect(mapFruit(base).image).toBeNull();
  });

  it('no inventa descripción ni tipo', () => {
    const fruit = mapFruit({ id: 2, name: 'Fruta' });
    expect(fruit.description).toBeNull();
    expect(fruit.type).toBeNull();
    expect(fruit.romanName).toBeNull();
  });
});

describe('mapCrew', () => {
  const raw: RawCrew = {
    id: 1,
    name: 'The Chapeau de Paille crew',
    status: 'assets',
    total_prime: '3.161.000.100',
    number: '10',
    is_yonko: true,
  };

  it('normaliza estado, integrantes y recompensa total', () => {
    const crew = mapCrew(raw);
    expect(crew.status).toBe('active');
    expect(crew.memberCount).toBe(10);
    expect(crew.totalBounty?.amount).toBe(3_161_000_100);
    expect(crew.isYonko).toBe(true);
  });

  it('traduce estados franceses', () => {
    expect(mapCrew({ ...raw, status: 'dissolved' }).status).toBe('dissolved');
    expect(mapCrew({ ...raw, status: 'arrêté' }).status).toBe('inactive');
    expect(mapCrew({ ...raw, status: null }).status).toBe('unknown');
  });
});

describe('mapSaga, mapArc y mapBoat', () => {
  const rawSaga: RawSaga = {
    id: 1,
    title: 'East Blue',
    saga_number: '1',
    saga_chapitre: '1 à 100',
    saga_volume: '1 à 12',
    saga_episode: '1 à 61',
  };

  it('mapea una saga completa', () => {
    const saga = mapSaga(rawSaga);
    expect(saga.number).toBe(1);
    expect(saga.chapters).toBe('1 à 100');
    expect(saga.episodes).toBe('1 à 61');
  });

  it('mapea un arco con su saga', () => {
    const rawArc: RawArc = {
      id: 1,
      title: 'Arc Romance Dawn',
      description: 'Inicio.',
      saga: rawSaga,
    };
    const arc = mapArc(rawArc);
    expect(arc.saga?.title).toBe('East Blue');
    expect(mapArc({ id: 2, title: 'Sin saga' }).saga).toBeNull();
  });

  it('mapea barco, tripulación y capitán sin inventar imagen', () => {
    const rawBoat: RawBoat = {
      id: 1,
      name: 'Vogue Merry',
      description: '',
      type: 'Pirate ship',
      roman_name: 'Gōingu Merī-gō',
      crew: { id: 1, name: 'The Chapeau de Paille crew' },
      character_captain: { id: 1, name: 'Monkey D Luffy' },
    };
    const boat = mapBoat(rawBoat);
    expect(boat.name).toBe('Vogue Merry');
    expect(boat.description).toBeNull();
    expect(boat.crew?.id).toBe(1);
    expect(boat.captain?.name).toBe('Monkey D Luffy');
    expect(boat.image).toBeNull();
  });
});
