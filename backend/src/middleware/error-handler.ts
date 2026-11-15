import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from '../utils/http-error';
import { env } from '../config/env';

/** Envuelve controladores async para centralizar el manejo de errores. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `La ruta ${req.method} ${req.originalUrl} no existe.`,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Errores de CORS lanzados por el middleware `cors`.
  if (error instanceof Error && /not allowed by CORS/i.test(error.message)) {
    res.status(403).json({
      error: {
        code: 'CORS_FORBIDDEN',
        message: 'El origen de la petición no está permitido.',
      },
    });
    return;
  }

  console.error('[error no controlado]', error);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Se produjo un error interno en el servidor.',
      ...(env.NODE_ENV === 'development' && error instanceof Error
        ? { details: error.message }
        : {}),
    },
  });
}
