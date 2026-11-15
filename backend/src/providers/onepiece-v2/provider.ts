import type {
  Arc,
  Boat,
  Character,
  Crew,
  Fruit,
  Saga,
} from '../../types/domain';
import type { DataProvider } from '../provider.interface';
import { OnepieceClient } from './client';
import {
  mapArc,
  mapBoat,
  mapCharacter,
  mapCrew,
  mapFruit,
  mapSaga,
  type RawArc,
  type RawBoat,
  type RawCharacter,
  type RawCrew,
  type RawFruit,
  type RawSaga,
} from './mappers';

/**
 * Adaptador del proveedor https://api.api-onepiece.com (v2).
 *
 * Endpoints reales comprobados:
 *   GET /v2/characters/:locale
 *   GET /v2/fruits/:locale
 *   GET /v2/crews/:locale
 *   GET /v2/sagas/:locale
 *   GET /v2/arcs/:locale
 *   GET /v2/boats/:locale
 *
 * No existen parámetros de paginación, filtrado ni búsqueda: el backend
 * descarga el catálogo completo una vez y lo cachea.
 */
export class OnepieceV2Provider implements DataProvider {
  readonly key = 'onepiece_v2';
  readonly label = 'API One Piece (api-onepiece.com · v2)';

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

  readonly limitations = [
    'La API externa no proporciona imágenes de personajes ni de barcos.',
    'Solo una parte de las frutas incluye imagen (25 de 213 en la fecha de validación).',
    'La API solo admite los idiomas en y fr; el contenido mezcla ambos idiomas.',
    'No existen endpoints de búsqueda, filtros ni paginación: se resuelven en nuestro backend.',
    'Algunos campos de origen contienen erratas (p. ej. recompensas con grupos de cuatro ceros); se normalizan cuando es posible.',
    'La página oficial de documentación devuelve 404; los endpoints se validaron por inspección directa.',
  ];

  constructor(private readonly client: OnepieceClient) {}

  async getCharacters(): Promise<Character[]> {
    const raw = await this.client.list<RawCharacter>('characters');
    return raw.map(mapCharacter);
  }

  async getFruits(): Promise<Fruit[]> {
    const raw = await this.client.list<RawFruit>('fruits');
    return raw.map(mapFruit);
  }

  async getCrews(): Promise<Crew[]> {
    const raw = await this.client.list<RawCrew>('crews');
    return raw.map(mapCrew);
  }

  async getSagas(): Promise<Saga[]> {
    const raw = await this.client.list<RawSaga>('sagas');
    return raw.map(mapSaga);
  }

  async getArcs(): Promise<Arc[]> {
    const raw = await this.client.list<RawArc>('arcs');
    return raw.map(mapArc);
  }

  async getBoats(): Promise<Boat[]> {
    const raw = await this.client.list<RawBoat>('boats');
    return raw.map(mapBoat);
  }
}
