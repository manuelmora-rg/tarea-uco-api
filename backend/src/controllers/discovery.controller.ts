import type { CatalogService } from '../services/catalog.service';
import {
  parse,
  searchQuerySchema,
  characterQuerySchema,
} from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { collectionMeta, entityMeta, withPublicMedia } from './serializers';

export function createDiscoveryController(service: CatalogService) {
  return {
    search: asyncHandler(async (req, res) => {
      const query = parse(searchQuerySchema, req.query);
      const results = await service.search(query.q, query.limit);

      res.json({
        data: {
          ...results,
          groups: {
            ...results.groups,
            characters: {
              ...results.groups.characters,
              items: results.groups.characters.items.map(withPublicMedia),
            },
            fruits: {
              ...results.groups.fruits,
              items: results.groups.fruits.items.map(withPublicMedia),
            },
            boats: {
              ...results.groups.boats,
              items: results.groups.boats.items.map(withPublicMedia),
            },
          },
        },
        meta: entityMeta(service.providerKey),
      });
    }),

    stats: asyncHandler(async (_req, res) => {
      const stats = await service.getStats();
      res.json({
        data: {
          ...stats,
          featuredCharacters: stats.featuredCharacters.map(withPublicMedia),
          topBounties: stats.topBounties.map(withPublicMedia),
          featuredFruits: stats.featuredFruits.map(withPublicMedia),
        },
        meta: entityMeta(service.providerKey),
      });
    }),

    filters: asyncHandler(async (_req, res) => {
      const filters = await service.getFilters();
      res.json({
        data: filters,
        meta: entityMeta(service.providerKey),
      });
    }),

    meta: asyncHandler(async (_req, res) => {
      res.json({
        data: service.getMeta(),
        meta: entityMeta(service.providerKey),
      });
    }),

    /** Carteles Wanted: solo personajes con recompensa, ordenados de mayor a menor. */
    bounties: asyncHandler(async (req, res) => {
      const query = parse(characterQuerySchema, {
        ...req.query,
        limit: req.query.limit ?? 12,
        hasBounty: 'true',
        sort: 'bounty_desc',
      });

      const page = await service.listCharacters({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sort: 'bounty_desc',
        hasBounty: true,
      });

      res.json({
        data: page.items.map(withPublicMedia),
        meta: collectionMeta(page, service.providerKey),
      });
    }),
  };
}
