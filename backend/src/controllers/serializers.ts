import type { Paginated } from '../types/domain';

export function collectionMeta(page: Paginated<unknown>, provider: string) {
  return {
    provider,
    generatedAt: new Date().toISOString(),
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  };
}

export function entityMeta(provider: string) {
  return {
    provider,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Sustituye la URL externa de una imagen por el proxy de nuestro backend,
 * de forma que el navegador nunca contacte directamente con el proveedor.
 */
export function withPublicMedia<T extends { image: string | null }>(entity: T): T {
  if (!entity.image) return entity;
  return {
    ...entity,
    image: `/api/media?src=${encodeURIComponent(entity.image)}`,
  };
}
