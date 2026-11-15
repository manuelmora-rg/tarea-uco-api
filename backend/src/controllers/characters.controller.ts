import type { CatalogService } from '../services/catalog.service';
import { parse, parseId, characterQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta, withPublicMedia } from './serializers';

export function createCharactersController(service: CatalogService) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parse(characterQuerySchema, req.query);
      const page = await service.listCharacters({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sort: query.sort,
        crew: query.crew,
        status: query.status,
        hasBounty:
          query.hasBounty === undefined ? undefined : query.hasBounty === 'true',
      });

      res.json({
        data: page.items.map(withPublicMedia),
        meta: collectionMeta(page, service.providerKey),
      });
    }),

    detail: asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const character = await service.getCharacter(id);
      res.json({
        data: withPublicMedia(character),
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
