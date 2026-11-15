import type { RequestHandler } from 'express';
import { isTest } from '../config/env';

/** Log de peticiones mínimo, sin dependencias externas. */
export const requestLogger: RequestHandler = (req, res, next) => {
  if (isTest) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} — ${durationMs.toFixed(1)} ms`,
    );
  });

  next();
};
