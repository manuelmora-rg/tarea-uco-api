import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createArcsController } from '../controllers/arcs.controller';

export function createArcsRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createArcsController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}
