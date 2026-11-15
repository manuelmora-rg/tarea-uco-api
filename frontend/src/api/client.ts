const RAW_BASE = import.meta.env.VITE_API_URL ?? '/api';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');
const API_ORIGIN = /^https?:\/\//.test(API_BASE) ? new URL(API_BASE).origin : '';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  const url = `${API_BASE}${path}${buildQuery(params)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.',
      'NETWORK_ERROR',
    );
  }

  if (!response.ok) {
    let payload: ErrorPayload | null = null;
    try {
      payload = (await response.json()) as ErrorPayload;
    } catch {
      // La respuesta de error no era JSON.
    }

    throw new ApiError(
      response.status,
      payload?.error?.message ?? `La petición falló con estado ${response.status}.`,
      payload?.error?.code ?? 'HTTP_ERROR',
      payload?.error?.details,
    );
  }

  return (await response.json()) as T;
}

/**
 * Convierte una ruta de imagen de nuestra API en una URL utilizable.
 * Si la API se sirve desde otro origen, se antepone dicho origen.
 */
export function assetUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${API_ORIGIN}${src}`;
}
