import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createDiscoveryController } from '../controllers/discovery.controller';

export function createDiscoveryRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createDiscoveryController(service);

  router.get('/search', controller.search);
  router.get('/stats', controller.stats);
  router.get('/filters', controller.filters);
  router.get('/meta', controller.meta);
  router.get('/bounties', controller.bounties);

  return router;
}
