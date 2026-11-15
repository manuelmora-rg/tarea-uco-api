import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createCharactersController } from '../controllers/characters.controller';

export function createCharactersRouter(service: CatalogService): Router {
  const router = Router();
  const controller = createCharactersController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}
