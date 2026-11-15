import type {
  Arc,
  Boat,
  Character,
  Crew,
  Fruit,
  Saga,
} from '../src/types/domain';
import type { DataProvider } from '../src/providers/provider.interface';

export const sagas: Saga[] = [
  {
    id: 1,
    title: 'East Blue',
    number: 1,
    chapters: '1 a 100',
    volumes: '1 a 12',
    episodes: '1 a 61',
  },
  {
    id: 2,
    title: 'Alabasta',
    number: 2,
    chapters: '101 a 216',
    volumes: '12 a 23',
    episodes: '62 a 143',
  },
];

export const characters: Character[] = [
  {
    id: 1,
    name: 'Monkey D. Luffy',
    job: 'Captain',
    status: 'alive',
    age: '19 años',
    height: '174 cm',
    bounty: { amount: 3_000_000_000, raw: '3.000.000.000', formatted: '฿ 3.000.000.000' },
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    fruit: { id: 196, name: 'Hito Hito no Mi, Modelo Nika', type: 'Zoan Mythique' },
    image: null,
  },
  {
    id: 2,
    name: 'Roronoa Zoro',
    job: 'Swordsman',
    status: 'alive',
    age: '21 años',
    height: '181 cm',
    bounty: { amount: 1_101_000_000, raw: '1.101.000.000', formatted: '฿ 1.101.000.000' },
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    fruit: null,
    image: null,
  },
  {
    id: 3,
    name: 'Nami',
    job: 'Navigator',
    status: 'alive',
    age: '20 años',
    height: '170 cm',
    bounty: { amount: 366_000_000, raw: '366.000.000', formatted: '฿ 366.000.000' },
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    fruit: null,
    image: null,
  },
  {
    id: 4,
    name: 'Buggy',
    job: 'Captain',
    status: 'alive',
    age: '39 años',
    height: '192 cm',
    bounty: { amount: 3_189_000_000, raw: '3.189.000.000', formatted: '฿ 3.189.000.000' },
    crew: { id: 2, name: 'Buggy Pirates', romanName: 'Baggy Kaizokudan' },
    fruit: { id: 2, name: 'Bara Bara no Mi', type: 'Paramecia' },
    image: null,
  },
  {
    id: 5,
    name: 'Imu',
    job: null,
    status: 'unknown',
    age: null,
    height: null,
    bounty: null,
    crew: null,
    fruit: null,
    image: null,
  },
  {
    id: 6,
    name: 'Tony Tony Chopper',
    job: 'Doctor',
    status: 'alive',
    age: '17 años',
    height: '90 cm',
    bounty: { amount: 1000, raw: '1000', formatted: '฿ 1.000' },
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    fruit: { id: 3, name: 'Hito Hito no Mi', type: 'Zoan' },
    image: null,
  },
];

export const fruits: Fruit[] = [
  {
    id: 1,
    name: 'Gum-Gum Fruit',
    romanName: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    description: 'Convierte el cuerpo del usuario en goma.',
    image: 'https://images.api-onepiece.com/fruits/gomu.png',
  },
  {
    id: 2,
    name: 'Fruit of Fragmentation',
    romanName: 'Bara Bara no Mi',
    type: 'Paramecia',
    description: 'Permite separar el cuerpo en partes.',
    image: null,
  },
  {
    id: 3,
    name: 'Human-Human Fruit',
    romanName: 'Hito Hito no Mi',
    type: 'Zoan',
    description: 'Permite al usuario transformarse en humano.',
    image: null,
  },
];

export const crews: Crew[] = [
  {
    id: 1,
    name: 'Straw Hat Pirates',
    romanName: 'Mugiwara no Ichimi',
    description: null,
    status: 'active',
    memberCount: 10,
    totalBounty: { amount: 3_161_000_100, raw: '3.161.000.100', formatted: '฿ 3.161.000.100' },
    isYonko: true,
  },
  {
    id: 2,
    name: 'Buggy Pirates',
    romanName: 'Baggy Kaizokudan',
    description: null,
    status: 'active',
    memberCount: 8,
    totalBounty: { amount: 20_000_000, raw: '20.000.000', formatted: '฿ 20.000.000' },
    isYonko: false,
  },
];

export const arcs: Arc[] = [
  { id: 1, title: 'Romance Dawn', description: 'Luffy comienza su viaje.', saga: sagas[0]! },
  { id: 14, title: 'Alabasta', description: 'La guerra de Alabasta.', saga: sagas[1]! },
];

export const boats: Boat[] = [
  {
    id: 1,
    name: 'Going Merry',
    romanName: 'Gōingu Merī-gō',
    type: 'Pirate ship',
    description: 'El primer barco de los Sombrero de Paja.',
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    captain: { id: 1, name: 'Monkey D. Luffy', romanName: null },
    image: null,
  },
  {
    id: 2,
    name: 'Thousand Sunny',
    romanName: 'Sauzando Sanī-gō',
    type: 'Pirate ship',
    description: 'El segundo barco de los Sombrero de Paja.',
    crew: { id: 1, name: 'Straw Hat Pirates', romanName: 'Mugiwara no Ichimi' },
    captain: { id: 1, name: 'Monkey D. Luffy', romanName: null },
    image: null,
  },
];

export class FakeProvider implements DataProvider {
  readonly key: string = 'fake_provider';
  readonly label: string = 'Proveedor de pruebas';
  readonly limitations: readonly string[] = ['Datos de prueba'];
  readonly capabilities = {
    remoteSearch: false,
    remotePagination: false,
    images: {
      characters: false,
      fruits: true,
      crews: false,
      boats: false,
      arcs: false,
    },
  } as const;

  async getCharacters(): Promise<Character[]> {
    return characters;
  }
  async getFruits(): Promise<Fruit[]> {
    return fruits;
  }
  async getCrews(): Promise<Crew[]> {
    return crews;
  }
  async getSagas(): Promise<Saga[]> {
    return sagas;
  }
  async getArcs(): Promise<Arc[]> {
    return arcs;
  }
  async getBoats(): Promise<Boat[]> {
    return boats;
  }
}
