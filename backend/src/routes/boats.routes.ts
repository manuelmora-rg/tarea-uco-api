import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createBoatsController } from '../controllers/boats.controller';

export function createBoatsRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createBoatsController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}
