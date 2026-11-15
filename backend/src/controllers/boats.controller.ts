import type { CatalogService } from '../services/catalog.service';
import { parse, parseId, boatQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta, withPublicMedia } from './serializers';

export function createBoatsController(service: CatalogService) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parse(boatQuerySchema, req.query);
      const page = await service.listBoats({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sort: query.sort,
        crew: query.crew,
      });

      res.json({
        data: page.items.map(withPublicMedia),
        meta: collectionMeta(page, service.providerKey),
      });
    }),

    detail: asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const boat = await service.getBoat(id);
      res.json({
        data: withPublicMedia(boat),
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
