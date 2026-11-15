import type { CatalogService } from '../services/catalog.service';
import { parse, parseId, fruitQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta, withPublicMedia } from './serializers';

export function createFruitsController(service: CatalogService) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parse(fruitQuerySchema, req.query);
      const page = await service.listFruits({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sort: query.sort,
        type: query.type,
      });

      res.json({
        data: page.items.map(withPublicMedia),
        meta: collectionMeta(page, service.providerKey),
      });
    }),

    detail: asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const fruit = await service.getFruit(id);
      res.json({
        data: withPublicMedia(fruit),
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
