import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createProvider, registerProvider } from '../src/providers/provider.factory';
import { UpstreamError } from '../src/utils/http-error';
import { FakeProvider } from './fixtures';

const app = createApp({ provider: new FakeProvider(), cacheTtlMs: 0 });

describe('salud y metadatos', () => {
  it('GET /api/health responde ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.provider).toBe('fake_provider');
  });

  it('GET /api/meta expone proveedor y limitaciones', async () => {
    const response = await request(app).get('/api/meta');
    expect(response.status).toBe(200);
    expect(response.body.data.provider.key).toBe('fake_provider');
    expect(response.body.data.provider.limitations).toEqual(['Datos de prueba']);
    expect(response.body.data.externalApi.version).toBe('v2');
  });
});

describe('personajes', () => {
  it('lista paginada ordenada por recompensa descendente', async () => {
    const response = await request(app).get('/api/characters');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(6);
    expect(response.body.data[0].name).toBe('Buggy');
    expect(response.body.meta).toMatchObject({
      provider: 'fake_provider',
      page: 1,
      limit: 24,
      total: 6,
      totalPages: 1,
    });
  });

  it('aplica paginación', async () => {
    const response = await request(app).get('/api/characters?page=2&limit=2');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.totalPages).toBe(3);
  });

  it('busca por nombre', async () => {
    const response = await request(app).get('/api/characters?search=luffy');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(1);
  });

  it('busca por tripulación y fruta', async () => {
    const byCrew = await request(app).get('/api/characters?search=mugiwara');
    expect(byCrew.body.data.length).toBe(4);

    const byFruit = await request(app).get('/api/characters?search=bara');
    expect(byFruit.body.data).toHaveLength(1);
    expect(byFruit.body.data[0].name).toBe('Buggy');
  });

  it('filtra por tripulación, estado y recompensa', async () => {
    const byCrew = await request(app).get('/api/characters?crew=1');
    expect(byCrew.body.data).toHaveLength(4);

    const alive = await request(app).get('/api/characters?status=alive');
    expect(alive.body.data).toHaveLength(5);

    const bounties = await request(app).get('/api/characters?hasBounty=true');
    expect(bounties.body.data).toHaveLength(5);
    expect(bounties.body.data.every((item: { bounty: unknown }) => item.bounty)).toBe(true);
  });

  it('ordena por nombre', async () => {
    const response = await request(app).get('/api/characters?sort=name_asc&limit=2');
    expect(response.body.data[0].name).toBe('Buggy');
    expect(response.body.data[1].name).toBe('Imu');
  });

  it('devuelve ficha individual', async () => {
    const response = await request(app).get('/api/characters/1');
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Monkey D. Luffy');
    expect(response.body.data.crew.id).toBe(1);
  });

  it('devuelve 404 si no existe', async () => {
    const response = await request(app).get('/api/characters/999');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('valida identificadores y límites', async () => {
    expect((await request(app).get('/api/characters/abc')).status).toBe(400);
    expect((await request(app).get('/api/characters?limit=999')).status).toBe(400);
    expect((await request(app).get('/api/characters?sort=invalido')).status).toBe(400);
    expect((await request(app).get('/api/characters?page=0')).status).toBe(400);
  });
});

describe('frutas', () => {
  it('lista frutas y proxifica sus imágenes', async () => {
    const response = await request(app).get('/api/fruits');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);

    const gomu = response.body.data.find(
      (fruit: { name: string }) => fruit.name === 'Gum-Gum Fruit',
    );
    expect(gomu.image).toMatch(/^\/api\/media\?src=/);

    const withoutImage = response.body.data.find(
      (fruit: { name: string }) => fruit.name === 'Fruit of Fragmentation',
    );
    expect(withoutImage.image).toBeNull();
  });

  it('filtra por tipo', async () => {
    const response = await request(app).get('/api/fruits?type=Zoan');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Human-Human Fruit');
  });

  it('busca por nombre romanizado', async () => {
    const response = await request(app).get('/api/fruits?search=gomu');
    expect(response.body.data).toHaveLength(1);
  });

  it('devuelve ficha y 404', async () => {
    const detail = await request(app).get('/api/fruits/1');
    expect(detail.status).toBe(200);
    expect(detail.body.data.description).toContain('goma');
    expect((await request(app).get('/api/fruits/999')).status).toBe(404);
  });
});

describe('tripulaciones', () => {
  it('lista ordenada por recompensa total', async () => {
    const response = await request(app).get('/api/crews');
    expect(response.body.data[0].id).toBe(1);
    expect(response.body.data[0].totalBounty.amount).toBe(3_161_000_100);
  });

  it('ficha con integrantes derivados y capitán', async () => {
    const response = await request(app).get('/api/crews/1');
    expect(response.status).toBe(200);
    expect(response.body.data.members).toHaveLength(4);
    expect(response.body.data.captain.name).toBe('Monkey D. Luffy');
    expect(response.body.data.members[0].name).toBe('Monkey D. Luffy');
  });

  it('devuelve 404 si no existe', async () => {
    expect((await request(app).get('/api/crews/999')).status).toBe(404);
  });
});

describe('arcos, sagas y barcos', () => {
  it('lista arcos en orden cronológico y filtra por saga', async () => {
    const all = await request(app).get('/api/arcs');
    expect(all.body.data.map((arc: { id: number }) => arc.id)).toEqual([1, 14]);

    const filtered = await request(app).get('/api/arcs?saga=2');
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].title).toBe('Alabasta');
  });

  it('lista sagas ordenadas', async () => {
    const response = await request(app).get('/api/sagas');
    expect(response.status).toBe(200);
    expect(response.body.data[0].title).toBe('East Blue');
  });

  it('lista barcos y filtra por tripulación', async () => {
    const response = await request(app).get('/api/boats?crew=1');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].captain.name).toBe('Monkey D. Luffy');
    expect(response.body.data[0].image).toBeNull();
  });

  it('devuelve ficha de arco y barco', async () => {
    expect((await request(app).get('/api/arcs/1')).body.data.saga.title).toBe('East Blue');
    expect((await request(app).get('/api/boats/1')).body.data.name).toBe('Going Merry');
  });
});

describe('recompensas', () => {
  it('solo incluye personajes con recompensa, de mayor a menor', async () => {
    const response = await request(app).get('/api/bounties');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.data[0].name).toBe('Buggy');
    expect(response.body.data.at(-1).name).toBe('Tony Tony Chopper');
    expect(response.body.meta.total).toBe(5);
  });

  it('ignora el orden solicitado y fuerza recompensa descendente', async () => {
    const response = await request(app).get('/api/bounties?sort=name_asc');
    expect(response.body.data[0].name).toBe('Buggy');
  });
});

describe('buscador global', () => {
  it('agrupa resultados por categoría', async () => {
    const response = await request(app).get('/api/search?q=straw');
    expect(response.status).toBe(200);
    expect(response.body.data.query).toBe('straw');
    expect(response.body.data.total).toBeGreaterThan(0);
    expect(response.body.data.groups.characters.total).toBe(4);
    expect(response.body.data.groups.crews.total).toBe(1);
    expect(response.body.data.groups.boats.total).toBe(2);
  });

  it('encuentra frutas y arcos', async () => {
    const fruit = await request(app).get('/api/search?q=goma');
    expect(fruit.body.data.groups.fruits.total).toBe(1);

    const arc = await request(app).get('/api/search?q=alabasta');
    expect(arc.body.data.groups.arcs.total).toBe(1);
  });

  it('exige al menos dos caracteres', async () => {
    const response = await request(app).get('/api/search?q=a');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve grupos vacíos sin error', async () => {
    const response = await request(app).get('/api/search?q=zzzzzz');
    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(0);
    expect(response.body.data.groups.characters.items).toEqual([]);
  });
});

describe('estadísticas', () => {
  it('resume el catálogo', async () => {
    const response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body.data.counts).toMatchObject({
      characters: 6,
      fruits: 3,
      crews: 2,
      boats: 2,
      arcs: 2,
      sagas: 2,
      charactersWithBounty: 5,
      fruitsWithImage: 1,
    });
    expect(response.body.data.featuredFruits[0].image).toMatch(/^\/api\/media\?src=/);
    expect(response.body.data.strongestCrew.id).toBe(1);
    expect(response.body.data.fruitTypes).toEqual(['Paramecia', 'Zoan']);
  });
});

describe('proxy de imágenes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rechaza URLs ausentes o inválidas', async () => {
    expect((await request(app).get('/api/media')).status).toBe(400);
    expect((await request(app).get('/api/media?src=no-es-una-url')).status).toBe(400);
  });

  it('rechaza hosts no autorizados y protocolos inseguros', async () => {
    const foreign = await request(app).get(
      '/api/media?src=' + encodeURIComponent('https://evil.example/x.png'),
    );
    expect(foreign.status).toBe(400);
    expect(foreign.body.error.code).toBe('MEDIA_HOST_NOT_ALLOWED');

    const insecure = await request(app).get(
      '/api/media?src=' + encodeURIComponent('http://images.api-onepiece.com/x.png'),
    );
    expect(insecure.status).toBe(400);
    expect(insecure.body.error.code).toBe('MEDIA_INVALID_PROTOCOL');
  });

  it('sirve imágenes del host permitido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { 'content-type': 'image/png', 'content-length': '4' },
        });
      }),
    );

    const response = await request(app).get(
      '/api/media?src=' +
        encodeURIComponent('https://images.api-onepiece.com/fruits/gomu.png'),
    );
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.headers['cache-control']).toContain('max-age=86400');
  });

  it('rechaza respuestas que no son imágenes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }),
    );

    const response = await request(app).get(
      '/api/media?src=' +
        encodeURIComponent('https://images.api-onepiece.com/fruits/fake.png'),
    );
    expect(response.status).toBe(502);
  });
});

describe('errores, CORS y rutas desconocidas', () => {
  it('responde 404 JSON en rutas desconocidas', async () => {
    const response = await request(app).get('/api/no-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('permite el origen configurado y bloquea otros', async () => {
    const allowed = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blocked = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil.example');
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('CORS_FORBIDDEN');
  });

  it('devuelve 502 si el proveedor falla', async () => {
    class FailingProvider extends FakeProvider {
      override async getCharacters(): Promise<never> {
        throw new UpstreamError('La API externa no está disponible.');
      }
    }

    const failingApp = createApp({ provider: new FailingProvider(), cacheTtlMs: 0 });
    const response = await request(failingApp).get('/api/characters');
    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('UPSTREAM_ERROR');
  });
});

describe('cambio de proveedor', () => {
  it('resuelve un proveedor registrado sin tocar el frontend', () => {
    registerProvider('fake_switch', () => new FakeProvider());
    const provider = createProvider('fake_switch');
    expect(provider.key).toBe('fake_provider');
  });

  it('falla con un proveedor desconocido', () => {
    expect(() => createProvider('proveedor_inexistente')).toThrow(
      /Proveedor de datos no soportado/,
    );
  });

  it('expone el proveedor activo en todas las respuestas', async () => {
    class SecondProvider extends FakeProvider {
      override readonly key: string = 'segundo_proveedor';
      override readonly label: string = 'Segundo proveedor';
    }

    const secondApp = createApp({ provider: new SecondProvider(), cacheTtlMs: 0 });
    const response = await request(secondApp).get('/api/characters?limit=1');
    expect(response.body.meta.provider).toBe('segundo_proveedor');

    const meta = await request(secondApp).get('/api/meta');
    expect(meta.body.data.provider.key).toBe('segundo_proveedor');
  });
});
