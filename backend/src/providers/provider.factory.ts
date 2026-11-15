import { env } from '../config/env';
import type { DataProvider, ImageEnrichmentSource } from './provider.interface';
import { OnepieceClient } from './onepiece-v2/client';
import { OnepieceV2Provider } from './onepiece-v2/provider';
import { OnepieceApiClient } from './onepieceapi/client';
import { OnepieceApiProvider } from './onepieceapi/provider';
import { MultisourceProvider } from './multisource/provider';

type ProviderFactory = () => DataProvider;

function createPrimaryProvider(): OnepieceV2Provider {
  return new OnepieceV2Provider(
    new OnepieceClient({
      baseUrl: env.ONEPIECE_API_BASE_URL,
      locale: env.ONEPIECE_API_LOCALE,
      timeoutMs: env.ONEPIECE_API_TIMEOUT_MS,
    }),
  );
}

function createImageProvider(): ImageEnrichmentSource | null {
  if (env.IMAGE_PROVIDER === 'none') return null;

  return new OnepieceApiProvider(
    new OnepieceApiClient({
      baseUrl: env.ONEPIECEAPI_BASE_URL,
      timeoutMs: env.ONEPIECEAPI_TIMEOUT_MS,
      pageSize: env.ONEPIECEAPI_PAGE_SIZE,
      maxPages: env.ONEPIECEAPI_MAX_PAGES,
    }),
    env.CACHE_TTL_MS,
  );
}

/**
 * Registro de proveedores.
 *
 * Para integrar una API privada basta con:
 *   1. Crear un adaptador que implemente DataProvider.
 *   2. Registrarlo aquí con registerProvider('mi_api', factory).
 *   3. Ejecutar el backend con DATA_PROVIDER=mi_api.
 *
 * El frontend no requiere ningún cambio.
 */
const registry = new Map<string, ProviderFactory>([
  ['onepiece_v2', createPrimaryProvider],
  [
    'onepiece_multisource',
    () =>
      new MultisourceProvider(createPrimaryProvider(), createImageProvider(), {
        enrichmentWaitMs: env.IMAGE_ENRICHMENT_WAIT_MS,
      }),
  ],
]);

export function registerProvider(key: string, factory: ProviderFactory): void {
  registry.set(key, factory);
}

export function listProviders(): string[] {
  return [...registry.keys()];
}

export function createProvider(key: string = env.DATA_PROVIDER): DataProvider {
  const factory = registry.get(key);
  if (!factory) {
    throw new Error(
      `Proveedor de datos no soportado: "${key}". ` +
        `Disponibles: ${listProviders().join(', ')}.`,
    );
  }
  return factory();
}
