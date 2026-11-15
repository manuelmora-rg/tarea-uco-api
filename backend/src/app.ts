import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, corsOrigins, isTest } from './config/env';
import type { DataProvider } from './providers/provider.interface';
import { createProvider } from './providers/provider.factory';
import { CatalogService } from './services/catalog.service';
import { createApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

export interface AppOptions {
  /** Permite inyectar un proveedor distinto (tests, futuras integraciones). */
  provider?: DataProvider;
  /** TTL de caché; por defecto el de la configuración. */
  cacheTtlMs?: number;
}

/**
 * Fábrica de la aplicación. El frontend solo conoce /api y nunca la API externa.
 */
export function createApp(options: AppOptions = {}): Express {
  const provider = options.provider ?? createProvider();
  const service = new CatalogService(provider, options.cacheTtlMs ?? env.CACHE_TTL_MS);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // El proxy de imágenes se consume desde el frontend.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true); // curl / server-to-server
        if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'OPTIONS'],
      maxAge: 86400,
    }),
  );

  app.use(express.json({ limit: '50kb' }));
  app.use(requestLogger);

  if (!isTest) {
    app.use(
      '/api',
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.',
          },
        },
      }),
    );
  }

  app.use('/api', createApiRouter(service));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
