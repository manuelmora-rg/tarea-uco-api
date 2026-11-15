import { UpstreamError } from '../../utils/http-error';

interface ClientOptions {
  baseUrl: string;
  timeoutMs: number;
  pageSize?: number;
  maxPages?: number;
  retries?: number;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_PAGE_SIZE = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cliente de la API complementaria onepieceapi.com.
 *
 * La API no devuelve metadatos de paginación y responde 500 cuando se solicita
 * una página fuera de rango, por lo que no se pueden pedir páginas en paralelo
 * sin provocar errores al final del catálogo. Se avanza de una en una hasta
 * recibir una página incompleta; un 500 en una página posterior a la primera
 * se interpreta como fin del catálogo.
 */
export class OnepieceApiClient {
  private readonly retries: number;

  constructor(private readonly options: ClientOptions) {
    this.retries = options.retries ?? 2;
  }

  async listAll<T>(resource: string): Promise<T[]> {
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, this.options.pageSize ?? MAX_PAGE_SIZE),
    );
    const maxPages = Math.max(1, this.options.maxPages ?? 60);

    const collected: T[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      let rows: T[];
      try {
        rows = await this.fetchPage<T>(resource, page, pageSize);
      } catch (error) {
        // La API devuelve 500 al pedir una página inexistente. Solo se tolera
        // cuando ya se ha descargado al menos una página completa.
        const upstreamStatus =
          error instanceof UpstreamError
            ? (error.details as { status?: number } | undefined)?.status
            : undefined;
        const isOutOfRange =
          page > 1 &&
          (upstreamStatus === 404 || upstreamStatus === 500 || upstreamStatus === 400);

        if (isOutOfRange) break;
        throw error;
      }

      if (!Array.isArray(rows)) {
        throw new UpstreamError(
          `Respuesta inesperada de la API de imágenes (${resource}).`,
        );
      }

      collected.push(...rows);
      if (rows.length < pageSize) break;

      if (page === maxPages) {
        throw new UpstreamError(
          `La API de imágenes superó el límite de ${maxPages} páginas (${resource}).`,
        );
      }
    }

    return collected;
  }

  private async fetchPage<T>(
    resource: string,
    page: number,
    pageSize: number,
  ): Promise<T[]> {
    const base = this.options.baseUrl.replace(/\/+$/, '');
    const url = `${base}/${resource}?page=${page}&limit=${pageSize}`;
    return (await this.request(url)) as T[];
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
              `La API de imágenes respondió ${response.status}.`,
            );
            await delay(250 * (attempt + 1));
            continue;
          }

          throw new UpstreamError(
            `La API de imágenes respondió con estado ${response.status}.`,
            { url, status: response.status },
          );
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          throw new UpstreamError('La API de imágenes no devolvió JSON.', {
            url,
            contentType,
          });
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        if (error instanceof UpstreamError) throw error;

        if (attempt >= this.retries) {
          const reason =
            error instanceof Error ? error.message : 'error desconocido';
          throw new UpstreamError(
            `No se pudo contactar con la API de imágenes: ${reason}`,
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
      : new UpstreamError('Error desconocido al contactar con la API de imágenes.');
  }
}
