import type { CatalogService } from '../services/catalog.service';
import { parse, parseId, arcQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta } from './serializers';

export function createArcsController(service: CatalogService) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parse(arcQuerySchema, req.query);
      const page = await service.listArcs({
        page: query.page,
        limit: query.limit,
        search: query.search,
        saga: query.saga,
      });

      res.json({
        data: page.items,
        meta: collectionMeta(page, service.providerKey),
      });
    }),

    detail: asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const arc = await service.getArc(id);
      res.json({ data: arc, meta: entityMeta(service.providerKey) });
    }),

    sagas: asyncHandler(async (_req, res) => {
      const sagas = await service.listSagas();
      res.json({
        data: sagas,
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
