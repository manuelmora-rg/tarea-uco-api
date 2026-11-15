import type { CatalogService } from '../services/catalog.service';
import { asyncHandler } from '../middleware/error-handler';
import { entityMeta } from './serializers';

export function createSagasController(service: CatalogService) {
  return {
    list: asyncHandler(async (_req, res) => {
      const sagas = await service.listSagas();
      res.json({ data: sagas, meta: entityMeta(service.providerKey) });
    }),
  };
}
