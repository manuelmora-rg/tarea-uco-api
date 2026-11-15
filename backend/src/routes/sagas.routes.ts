import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createSagasController } from '../controllers/sagas.controller';

export function createSagasRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createSagasController(service);
  router.get('/', controller.list);
  return router;
}
