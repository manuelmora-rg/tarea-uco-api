import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createCrewsController } from '../controllers/crews.controller';

export function createCrewsRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createCrewsController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}
