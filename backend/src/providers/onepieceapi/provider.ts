import type { ProviderCapabilities } from '../../types/domain';
import type { ImageEnrichmentSource } from '../provider.interface';
import { TtlCache } from '../../utils/ttl-cache';
import { OnepieceApiClient } from './client';
import {
  mapEnrichmentCharacter,
  mapEnrichmentFruit,
  mapEnrichmentShip,
} from './mappers';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
  RawCharacter,
  RawFruit,
  RawShip,
} from './types';

/**
 * Adaptador de imágenes y datos complementarios de https://onepieceapi.com.
 *
 * Endpoints validados:
 *   GET /api/characters?page=1&limit=100
 *   GET /api/devil-fruits?page=1&limit=100
 *   GET /api/ships?page=1&limit=100
 *
 * La API es pública, sin clave, y su código se publica bajo licencia MIT. Los
 * catálogos se cachean con TTL y se deduplican las cargas concurrentes.
 */
export class OnepieceApiProvider implements ImageEnrichmentSource {
  readonly key = 'onepieceapi';
  readonly label = 'onepieceapi.com (imágenes y datos complementarios)';

  readonly capabilities: ProviderCapabilities = {
    remoteSearch: false,
    remotePagination: true,
    images: {
      characters: true,
      fruits: true,
      crews: false,
      boats: true,
      arcs: false,
    },
  };

  readonly limitations = [
    'Los identificadores son UUID y no guardan relación con los IDs numéricos de api-onepiece.com.',
    '912 de 1.431 personajes incluyen retrato; los demás conservan el marcador de la interfaz.',
    'Los 50 barcos incluyen imagen.',
    'Solo 27 de 114 frutas tienen arte específico; las 87 restantes usan ilustraciones genéricas por tipo y se descartan.',
    'La paginación devuelve como máximo 100 registros por página y no incluye metadatos de total.',
  ];

  private readonly cache: TtlCache;

  constructor(
    private readonly client: OnepieceApiClient,
    cacheTtlMs = 600_000,
  ) {
    this.cache = new TtlCache(cacheTtlMs, 10);
  }

  getCharacterCatalog(): Promise<EnrichmentCharacter[]> {
    return this.cache.getOrLoad('characters', async () => {
      const raw = await this.client.listAll<RawCharacter>('characters');
      return raw.map(mapEnrichmentCharacter);
    });
  }

  getFruitCatalog(): Promise<EnrichmentFruit[]> {
    return this.cache.getOrLoad('devil-fruits', async () => {
      const raw = await this.client.listAll<RawFruit>('devil-fruits');
      return raw.map(mapEnrichmentFruit);
    });
  }

  getShipCatalog(): Promise<EnrichmentShip[]> {
    return this.cache.getOrLoad('ships', async () => {
      const raw = await this.client.listAll<RawShip>('ships');
      return raw.map(mapEnrichmentShip);
    });
  }
}
