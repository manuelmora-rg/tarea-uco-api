import { describe, expect, it } from 'vitest';
import { createProvider } from '../src/providers/provider.factory';
import type { ImageEnrichmentSource } from '../src/providers/provider.interface';
import { createApp } from '../src/app';
import request from 'supertest';

/**
 * Pruebas de integración reales contra las APIs externas.
 * Se ejecutan con: npm run test:live
 */
const LIVE = process.env.LIVE_API_TESTS === '1';

describe.skipIf(!LIVE)('API externa real (api-onepiece.com v2)', () => {
  const provider = createProvider('onepiece_v2');

  it('descarga y normaliza personajes', async () => {
    const characters = await provider.getCharacters();
    expect(characters.length).toBeGreaterThan(700);
    expect(characters[0]).toHaveProperty('name');
    expect(characters.some((character) => character.bounty !== null)).toBe(true);
  });

  it('descarga y normaliza frutas con imágenes', async () => {
    const fruits = await provider.getFruits();
    expect(fruits.length).toBeGreaterThan(200);
    const withImage = fruits.filter((fruit) => fruit.image !== null);
    expect(withImage.length).toBeGreaterThan(10);
    expect(withImage[0]?.image).toMatch(/^https:\/\//);
  });

  it('descarga tripulaciones, arcos, sagas y barcos', async () => {
    const [crews, arcs, sagas, boats] = await Promise.all([
      provider.getCrews(),
      provider.getArcs(),
      provider.getSagas(),
      provider.getBoats(),
    ]);

    expect(crews.length).toBeGreaterThan(100);
    expect(arcs.length).toBeGreaterThan(30);
    expect(sagas.length).toBeGreaterThan(5);
    expect(boats.length).toBeGreaterThan(50);
    expect(arcs.every((arc) => arc.saga !== null)).toBe(true);
  });

  it('una imagen real del proveedor responde con contenido de imagen', async () => {
    const fruits = await provider.getFruits();
    const imageUrl = fruits.find((fruit) => fruit.image !== null)?.image;
    expect(imageUrl).toBeTruthy();

    const response = await fetch(imageUrl!, { method: 'GET' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/');
  });

  it('el backend sirve datos reales a través de nuestra API', async () => {
    const app = createApp({ provider, cacheTtlMs: 0 });
    const response = await request(app).get('/api/characters?limit=3');
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    expect(response.body.meta.provider).toBe('onepiece_v2');

    const search = await request(app).get('/api/search?q=luffy');
    expect(search.status).toBe(200);
    expect(search.body.data.groups.characters.total).toBeGreaterThan(0);
  });
});

describe.skipIf(!LIVE)(
  'API real de imágenes (onepieceapi.com) y proveedor multifuente',
  () => {
    const provider = createProvider('onepiece_multisource');

    it('expone la fuente de imágenes como proveedor independiente', () => {
      const imageProvider = provider.imageProvider as ImageEnrichmentSource | null;
      expect(imageProvider).not.toBeNull();
      expect(imageProvider?.key).toBe('onepieceapi');
      expect(imageProvider?.capabilities.images.characters).toBe(true);
    });

    it('descarga los catálogos complementarios con su paginación', async () => {
      const imageProvider = provider.imageProvider as ImageEnrichmentSource;
      const [characters, fruits, ships] = await Promise.all([
        imageProvider.getCharacterCatalog(),
        imageProvider.getFruitCatalog(),
        imageProvider.getShipCatalog(),
      ]);

      expect(characters.length).toBeGreaterThan(1_000);
      expect(fruits.length).toBeGreaterThan(100);
      expect(ships.length).toBe(50);

      // El arte genérico por tipo nunca se conserva como imagen de una fruta.
      expect(
        fruits.every(
          (fruit) => fruit.image === null || !/\/generic-/.test(fruit.image),
        ),
      ).toBe(true);
      expect(fruits.some((fruit) => fruit.image !== null)).toBe(true);
    });

    it('asocia retratos reales a los personajes principales', async () => {
      const characters = await provider.getCharacters();
      const expected = [
        'Monkey D Luffy',
        'Roronoa Zoro',
        'Nami',
        'Sanji',
        'Tony-Tony Chopper',
      ];

      for (const name of expected) {
        const character = characters.find((item) => item.name === name);
        expect(character, `No se encontró ${name}`).toBeTruthy();
        expect(character?.image, `${name} sin imagen`).toMatch(/^https:\/\//);
        expect(character?.source?.image).toBe('onepieceapi');
        expect(character?.source?.match).not.toBeNull();
      }
    });

    it('asocia imágenes a Going Merry y Thousand Sunny', async () => {
      const boats = await provider.getBoats();
      const merry = boats.find((boat) => boat.name === 'Vogue Merry');
      const sunny = boats.find((boat) => boat.name === 'Thousand Sunny');

      expect(merry?.image).toMatch(/going-merry\.webp$/);
      expect(merry?.source?.image).toBe('onepieceapi');
      expect(sunny?.image).toMatch(/thousand-sunny\.webp$/);
      expect(sunny?.source?.image).toBe('onepieceapi');
    });

    it('usa arte específico de fruta y desambigua por modelo', async () => {
      const fruits = await provider.getFruits();
      const bara = fruits.find((fruit) => fruit.romanName === 'Bara Bara no Mi');
      const nika = fruits.find(
        (fruit) => fruit.romanName === 'Hito Hito no Mi, Moderu: Nika',
      );
      const buddha = fruits.find(
        (fruit) => fruit.romanName === 'Hito Hito no Mi moderu Daibutsu',
      );

      expect(bara?.image).toMatch(/bara-bara-no-mi\.webp$/);
      expect(bara?.source?.image).toBe('onepieceapi');

      expect(nika?.image).toMatch(/hito-hito-no-mi-nika\.webp$/);
      expect(nika?.source?.match).toBe('name-model');

      expect(buddha?.image).toMatch(/hito-hito-no-mi\.webp$/);
      expect(buddha?.source?.match).toBe('name-model');
    });

    it('mantiene tripulaciones, sagas y arcos desde la fuente principal', async () => {
      const [crews, sagas, arcs] = await Promise.all([
        provider.getCrews(),
        provider.getSagas(),
        provider.getArcs(),
      ]);

      expect(crews.length).toBeGreaterThan(100);
      expect(sagas.length).toBeGreaterThan(5);
      expect(arcs.length).toBeGreaterThan(30);
    });

    it('proxy de medios devuelve una imagen real del nuevo host', async () => {
      const characters = await provider.getCharacters();
      const luffy = characters.find((item) => item.name === 'Monkey D Luffy');
      expect(luffy?.image).toBeTruthy();

      const app = createApp({ provider, cacheTtlMs: 0 });
      const response = await request(app)
        .get('/api/media')
        .query({ src: luffy!.image! })
        .buffer(true);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/');
      expect(Number(response.headers['content-length'] ?? 0)).toBeGreaterThan(0);
    });

    it('la API pública expone procedencia y URLs de imagen proxificadas', async () => {
      const app = createApp({ provider, cacheTtlMs: 0 });

      const meta = await request(app).get('/api/meta');
      expect(meta.body.data.provider.key).toBe('onepiece_multisource');
      expect(meta.body.data.imageProvider.key).toBe('onepieceapi');
      expect(meta.body.data.externalApis).toHaveLength(2);

      const characters = await request(app).get('/api/characters?limit=10');
      expect(characters.status).toBe(200);
      expect(
        characters.body.data.every(
          (item: { image: string | null }) =>
            item.image === null || item.image.startsWith('/api/media?src='),
        ),
      ).toBe(true);

      const stats = await request(app).get('/api/stats');
      expect(stats.body.data.counts.charactersWithImage).toBeGreaterThan(0);
      expect(stats.body.data.counts.boatsWithImage).toBeGreaterThan(0);
    });

    it('onepiece_v2 sigue funcionando sin enriquecimiento', async () => {
      const plain = createProvider('onepiece_v2');
      const characters = await plain.getCharacters();
      const luffy = characters.find((item) => item.name === 'Monkey D Luffy');

      expect(luffy?.source).toBeUndefined();
    });
  },
);
