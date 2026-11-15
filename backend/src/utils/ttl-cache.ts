interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Caché TTL en memoria con deduplicación de peticiones concurrentes.
 *
 * El catálogo externo es pequeño (cientos de registros) y cambia con poca
 * frecuencia, por lo que una caché en proceso evita golpear la API en cada
 * petición del frontend sin añadir infraestructura.
 */
export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 50,
  ) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Devuelve el valor cacheado o ejecuta el cargador una sola vez, incluso si
   * varias peticiones llegan al mismo tiempo.
   *
   * `shouldCache` permite descartar resultados provisionales (por ejemplo, un
   * catálogo servido sin enriquecimiento mientras la fuente de imágenes sigue
   * cargando en segundo plano) sin romper la deduplicación de peticiones.
   */
  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T>,
    shouldCache: () => boolean = () => true,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const promise = loader()
      .then((value) => {
        if (shouldCache()) this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
