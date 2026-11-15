import { Router } from 'express';
import type { CatalogService } from '../services/catalog.service';
import { createHealthController } from '../controllers/health.controller';
import { mediaController } from '../controllers/media.controller';
import { createCharactersRouter } from './characters.routes';
import { createFruitsRouter } from './fruits.routes';
import { createCrewsRouter } from './crews.routes';
import { createArcsRouter } from './arcs.routes';
import { createBoatsRouter } from './boats.routes';
import { createSagasRouter } from './sagas.routes';
import { createDiscoveryRouter } from './discovery.routes';

/** Punto único de montaje de la API interna (/api). */
export function createApiRouter(service: CatalogService): Router {
  const router = Router();
  const health = createHealthController(service);

  router.get('/health', health.basic);
  router.get('/health/upstream', health.upstream);
  router.get('/media', mediaController.serve);

  router.use(createDiscoveryRouter(service));
  router.use('/characters', createCharactersRouter(service));
  router.use('/fruits', createFruitsRouter(service));
  router.use('/crews', createCrewsRouter(service));
  router.use('/arcs', createArcsRouter(service));
  router.use('/sagas', createSagasRouter(service));
  router.use('/boats', createBoatsRouter(service));

  return router;
}
