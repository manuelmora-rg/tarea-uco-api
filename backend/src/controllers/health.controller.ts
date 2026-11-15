import type { CatalogService } from '../services/catalog.service';
import { asyncHandler } from '../middleware/error-handler';
import { entityMeta } from './serializers';

export function createHealthController(service: CatalogService) {
  return {
    basic: asyncHandler(async (_req, res) => {
      res.json({
        status: 'ok',
        provider: service.providerKey,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }),

    upstream: asyncHandler(async (_req, res) => {
      const startedAt = Date.now();
      const characters = await service.getCharacters();
      const fruits = await service.getFruits();

      res.json({
        status: 'ok',
        data: {
          characters: characters.length,
          fruits: fruits.length,
          latencyMs: Date.now() - startedAt,
        },
        meta: entityMeta(service.providerKey),
      });
    }),
  };
}
