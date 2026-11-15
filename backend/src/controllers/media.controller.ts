import type { NextFunction, Request, Response } from 'express';
import { env, allowedMediaHosts } from '../config/env';
import { parse } from '../middleware/validation';
import { mediaQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { HttpError, UpstreamError } from '../utils/http-error';

const MEDIA_TIMEOUT_MS = 12_000;

/**
 * Proxy de imágenes.
 *
 * Evita que el navegador hable directamente con el proveedor externo y aplica
 * una lista blanca de hosts para impedir SSRF. No se aceptan URLs http.
 */
export function mediaHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const run = async () => {
    const { src } = parse(mediaQuerySchema, req.query);
    const url = new URL(src);

    if (url.protocol !== 'https:') {
      throw new HttpError(400, 'Solo se permiten imágenes servidas por HTTPS.', 'MEDIA_INVALID_PROTOCOL');
    }

    if (!allowedMediaHosts.includes(url.hostname.toLowerCase())) {
      throw new HttpError(
        400,
        'El host de la imagen no está autorizado.',
        'MEDIA_HOST_NOT_ALLOWED',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MEDIA_TIMEOUT_MS);

    try {
      const upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'image/*',
          'User-Agent': 'OnePieceExplorer/1.0 (+media proxy)',
        },
      });

      if (!upstream.ok) {
        throw new UpstreamError(
          `El servidor de imágenes respondió ${upstream.status}.`,
        );
      }

      const contentType = upstream.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        throw new UpstreamError('El recurso solicitado no es una imagen.');
      }

      const declaredSize = Number(upstream.headers.get('content-length') ?? 0);
      if (declaredSize > env.MEDIA_MAX_BYTES) {
        throw new HttpError(413, 'La imagen supera el tamaño máximo permitido.', 'MEDIA_TOO_LARGE');
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.byteLength > env.MEDIA_MAX_BYTES) {
        throw new HttpError(413, 'La imagen supera el tamaño máximo permitido.', 'MEDIA_TOO_LARGE');
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(buffer);
    } finally {
      clearTimeout(timeout);
    }
  };

  // No usamos asyncHandler para poder tipar el retorno como void.
  void Promise.resolve()
    .then(run)
    .catch(next);
}

export const mediaController = { serve: mediaHandler };
