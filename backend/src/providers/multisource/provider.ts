import type {
  Arc,
  Boat,
  Character,
  Crew,
  EntitySource,
  Fruit,
  ProviderCapabilities,
  Saga,
} from '../../types/domain';
import type {
  DataProvider,
  ImageEnrichmentSource,
  ProviderInfo,
} from '../provider.interface';
import { formatBeli } from '../onepiece-v2/mappers';
import {
  matchCharacters,
  matchFruits,
  matchShips,
  type CharacterMatch,
  type FruitMatch,
  type ShipMatch,
} from './matcher';
import type {
  EnrichmentCharacter,
  EnrichmentFruit,
  EnrichmentShip,
} from '../onepieceapi/types';

/**
 * Proveedor compuesto: datos base de api-onepiece.com v2 e imágenes/datos
 * complementarios de onepieceapi.com.
 *
 * Reglas:
 *  - La fuente principal nunca se sobrescribe: solo se rellenan huecos.
 *  - Toda imagen asociada pasa por una correspondencia segura.
 *  - Si la fuente complementaria falla, se devuelve el catálogo principal.
 */
export interface MultisourceOptions {
  /**
   * Tiempo máximo que una petición espera al catálogo de imágenes.
   * Si se supera, se responde con los datos base y la carga continúa en
   * segundo plano para las siguientes peticiones. 0 desactiva el límite.
   */
  enrichmentWaitMs?: number;
}

export class MultisourceProvider implements DataProvider {
  readonly key = 'onepiece_multisource';
  readonly label = 'Multifuente (api-onepiece.com v2 + onepieceapi.com)';

  private readonly enrichmentWaitMs: number;
  private readonly pendingCatalogs = new Set<string>();

  constructor(
    private readonly primary: DataProvider,
    private readonly enrichment: ImageEnrichmentSource | null,
    options: MultisourceOptions = {},
  ) {
    this.enrichmentWaitMs = options.enrichmentWaitMs ?? 4_000;
  }

  get imageProvider(): ProviderInfo | null {
    return this.enrichment;
  }

  isEnrichmentPending(resource: string): boolean {
    return this.pendingCatalogs.has(resource);
  }

  get capabilities(): ProviderCapabilities {
    const primary = this.primary.capabilities;
    return {
      remoteSearch: primary.remoteSearch,
      remotePagination: primary.remotePagination,
      images: {
        characters:
          primary.images.characters || (this.enrichment?.capabilities.images.characters ?? false),
        fruits:
          primary.images.fruits || (this.enrichment?.capabilities.images.fruits ?? false),
        crews: primary.images.crews,
        boats:
          primary.images.boats || (this.enrichment?.capabilities.images.boats ?? false),
        arcs: primary.images.arcs,
      },
    };
  }

  get limitations(): readonly string[] {
    const limitations = [
      'Los datos base (arcos, sagas, tripulaciones y recompensas) proceden de api-onepiece.com v2.',
      'La nueva API solo aporta imágenes y rellena edad, estado o recompensa cuando la fuente principal no los tiene.',
      'La correspondencia se resuelve por nombre oficial o romanizado; los casos ambiguos se descartan antes que asociar una imagen incorrecta.',
      'Las frutas con ilustración genérica por tipo se ignoran y conservan la imagen anterior o el marcador.',
      'Si la API de imágenes no responde, la aplicación sigue funcionando con los datos base y marcadores.',
    ];

    return limitations;
  }

  async getCharacters(): Promise<Character[]> {
    const characters = await this.primary.getCharacters();
    if (!this.enrichment) return characters.map((character) => this.withPrimarySource(character));

    const catalog = await this.loadCatalog<EnrichmentCharacter>(
      'characters',
      () => this.enrichment!.getCharacterCatalog(),
    );
    if (!catalog) return characters.map((character) => this.withPrimarySource(character));

    const matches = matchCharacters(characters, catalog);
    return characters.map((character) => this.enrichCharacter(character, matches.get(character.id)));
  }

  async getFruits(): Promise<Fruit[]> {
    const fruits = await this.primary.getFruits();
    if (!this.enrichment) return fruits.map((fruit) => this.withPrimarySource(fruit));

    const catalog = await this.loadCatalog<EnrichmentFruit>(
      'fruits',
      () => this.enrichment!.getFruitCatalog(),
    );
    if (!catalog) return fruits.map((fruit) => this.withPrimarySource(fruit));

    const matches = matchFruits(fruits, catalog);
    return fruits.map((fruit) => this.enrichFruit(fruit, matches.get(fruit.id)));
  }

  async getBoats(): Promise<Boat[]> {
    const boats = await this.primary.getBoats();
    if (!this.enrichment) return boats.map((boat) => this.withPrimarySource(boat));

    const catalog = await this.loadCatalog<EnrichmentShip>(
      'boats',
      () => this.enrichment!.getShipCatalog(),
    );
    if (!catalog) return boats.map((boat) => this.withPrimarySource(boat));

    const matches = matchShips(boats, catalog);
    return boats.map((boat) => this.enrichBoat(boat, matches.get(boat.id)));
  }

  async getCrews(): Promise<Crew[]> {
    const crews = await this.primary.getCrews();
    return crews.map((crew) => ({
      ...crew,
      source: {
        data: this.primary.key,
        image: null,
        match: null,
      },
    }));
  }

  getSagas(): Promise<Saga[]> {
    return this.primary.getSagas();
  }

  getArcs(): Promise<Arc[]> {
    return this.primary.getArcs();
  }

  private async loadCatalog<T>(
    resource: string,
    loader: () => Promise<T[]>,
  ): Promise<T[] | null> {
    // La carga continúa en segundo plano aunque venza la espera: la caché de
    // la fuente de imágenes conservará el resultado para la siguiente petición.
    const loading = loader().catch(() => null);

    if (this.enrichmentWaitMs <= 0) {
      const rows = await loading;
      this.pendingCatalogs.delete(resource);
      return rows;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, this.enrichmentWaitMs);
    });

    try {
      const rows = await Promise.race([loading, timeout]);

      if (timedOut) {
        // La respuesta es provisional: el servicio no debe cachearla sin
        // imágenes. Cuando termine la carga se podrá volver a intentar.
        this.pendingCatalogs.add(resource);
        void loading.finally(() => this.pendingCatalogs.delete(resource));
      } else {
        this.pendingCatalogs.delete(resource);
      }

      return rows;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private withPrimarySource<T extends Character | Fruit | Boat>(entity: T): T {
    return {
      ...entity,
      source: {
        data: this.primary.key,
        image: entity.image ? this.primary.key : null,
        match: null,
      },
    };
  }

  private source(imageProvider: string | null, match: string | null): EntitySource {
    return {
      data: this.primary.key,
      image: imageProvider,
      match,
    };
  }

  private enrichCharacter(character: Character, match: CharacterMatch | undefined): Character {
    if (!match) return this.withPrimarySource(character);

    const image = match.image ?? character.image;
    const imageProvider = match.image
      ? this.enrichment?.key ?? null
      : image
        ? this.primary.key
        : null;

    return {
      ...character,
      image,
      // Solo se rellenan huecos; nunca se sobrescribe un dato de la fuente base.
      age:
        character.age ??
        (match.record.age !== null ? `${match.record.age} años` : null),
      status:
        character.status ??
        (match.record.status !== null ? match.record.status : null),
      bounty:
        character.bounty ??
        (match.record.bounty !== null
          ? {
              amount: match.record.bounty,
              raw: String(match.record.bounty),
              formatted: formatBeli(match.record.bounty),
            }
          : null),
      source: this.source(imageProvider, match.strategy),
    };
  }

  private enrichFruit(fruit: Fruit, match: FruitMatch | undefined): Fruit {
    if (!match || !match.image) return this.withPrimarySource(fruit);

    return {
      ...fruit,
      image: match.image,
      source: this.source(this.enrichment?.key ?? null, match.strategy),
    };
  }

  private enrichBoat(boat: Boat, match: ShipMatch | undefined): Boat {
    if (!match || !match.image) return this.withPrimarySource(boat);

    return {
      ...boat,
      image: match.image,
      source: this.source(this.enrichment?.key ?? null, match.strategy),
    };
  }
}
