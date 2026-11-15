import type { CatalogService } from '../services/catalog.service';
import { parse, parseId, crewQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta, withPublicMedia } from './serializers';

export function createCrewsController(service: CatalogService) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parse(crewQuerySchema, req.query);
      const page = await service.listCrews({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sort: query.sort,
        status: query.status,
      });

      res.json({
        data: page.items,
        meta: collectionMeta(page, service.providerKey),
      });
    }),

    detail: asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const crew = await service.getCrew(id);
      res.json({
        data: { ...crew, members: crew.members.map(withPublicMedia) },
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
