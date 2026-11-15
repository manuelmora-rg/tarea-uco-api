import { UpstreamError } from '../../utils/http-error';

interface ClientOptions {
  baseUrl: string;
  locale: string;
  timeoutMs: number;
  retries?: number;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cliente HTTP del proveedor api-onepiece.com (v2).
 *
 * Se aísla aquí cualquier detalle del transporte (timeout, reintentos,
 * cabeceras). El adaptador nunca construye URLs de la API externa.
 */
export class OnepieceClient {
  private readonly retries: number;

  constructor(private readonly options: ClientOptions) {
    this.retries = options.retries ?? 2;
  }

  async list<T>(resource: string): Promise<T[]> {
    const base = this.options.baseUrl.replace(/\/+$/, '');
    const url = `${base}/${resource}/${this.options.locale}`;
    const payload = await this.request(url);

    if (!Array.isArray(payload)) {
      throw new UpstreamError(`Respuesta inesperada de la API externa (${resource}).`);
    }

    return payload as T[];
  }

  private async request(url: string): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.options.timeoutMs,
      );

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'OnePieceExplorer/1.0 (+backend proxy)',
          },
        });

        if (!response.ok) {
          if (RETRYABLE_STATUS.has(response.status) && attempt < this.retries) {
            lastError = new UpstreamError(
              `La API externa respondió ${response.status}.`,
            );
            await delay(250 * (attempt + 1));
            continue;
          }

          throw new UpstreamError(
            `La API externa respondió con estado ${response.status}.`,
            { url, status: response.status },
          );
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          throw new UpstreamError('La API externa no devolvió JSON.', {
            url,
            contentType,
          });
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        if (error instanceof UpstreamError) {
          // Los 5xx reintentables ya se gestionan en la rama de respuesta.
          // Un error de este tipo que llega aquí es definitivo (p. ej. 4xx).
          throw error;
        }

        if (attempt >= this.retries) {
          const reason =
            error instanceof Error ? error.message : 'error desconocido';
          throw new UpstreamError(
            `No se pudo contactar con la API externa: ${reason}`,
            { url },
          );
        }

        await delay(250 * (attempt + 1));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new UpstreamError('Error desconocido al contactar con la API externa.');
  }
}
