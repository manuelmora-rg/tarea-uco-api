import type { ProviderCapabilities } from '../types/domain';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
} from './onepieceapi/types';

/** Metadatos comunes de cualquier fuente de datos o de imágenes. */
export interface ProviderInfo {
  readonly key: string;
  readonly label: string;
  readonly limitations: readonly string[];
  readonly capabilities: ProviderCapabilities;
}

/**
 * Fuente complementaria de imágenes y datos.
 *
 * Se mantiene separada del contrato principal para que pueda sustituirse sin
 * tocar el proveedor de datos ni el frontend.
 */
export interface ImageEnrichmentSource extends ProviderInfo {
  getCharacterCatalog(): Promise<EnrichmentCharacter[]>;
  getFruitCatalog(): Promise<EnrichmentFruit[]>;
  getShipCatalog(): Promise<EnrichmentShip[]>;
}

export interface DataProvider extends ProviderInfo {
  /** Fuente de imágenes complementaria, si este proveedor la utiliza. */
  readonly imageProvider?: ProviderInfo | null;

  /**
   * Indica si el enriquecimiento de un recurso sigue cargándose en segundo
   * plano. Permite no cachear una respuesta provisional sin imágenes.
   */
  isEnrichmentPending?(resource: string): boolean;

  getCharacters(): Promise<import('../types/domain').Character[]>;
  getFruits(): Promise<import('../types/domain').Fruit[]>;
  getCrews(): Promise<import('../types/domain').Crew[]>;
  getSagas(): Promise<import('../types/domain').Saga[]>;
  getArcs(): Promise<import('../types/domain').Arc[]>;
  getBoats(): Promise<import('../types/domain').Boat[]>;
}
