import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createFruitsController } from '../controllers/fruits.controller';

export function createFruitsRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createFruitsController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}
