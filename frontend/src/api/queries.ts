import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { apiGet } from './client';
import type {
  ApiMeta,
  Arc,
  Boat,
  Character,
  Crew,
  CrewDetail,
  EntityResponse,
  Filters,
  Fruit,
  HealthResponse,
  ListResponse,
  Saga,
  SearchResults,
  Stats,
} from '../types/api';

export interface CharacterParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  crew?: number;
  status?: string;
  hasBounty?: 'true' | 'false';
}

export interface FruitParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  type?: string;
}

export interface CrewParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: string;
}

export interface ArcParams {
  page?: number;
  limit?: number;
  search?: string;
  saga?: number;
}

export interface BoatParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  crew?: number;
}

const toRecord = (params: object) => params as Record<string, string | number | boolean | undefined>;

export const getCharacters = (params: CharacterParams = {}) =>
  apiGet<ListResponse<Character>>('/characters', toRecord(params));

export const getBounties = (params: CharacterParams = {}) =>
  apiGet<ListResponse<Character>>('/bounties', toRecord(params));

export const getCharacter = (id: string) =>
  apiGet<EntityResponse<Character>>(`/characters/${id}`);

export const getFruits = (params: FruitParams = {}) =>
  apiGet<ListResponse<Fruit>>('/fruits', toRecord(params));

export const getFruit = (id: string) => apiGet<EntityResponse<Fruit>>(`/fruits/${id}`);

export const getCrews = (params: CrewParams = {}) =>
  apiGet<ListResponse<Crew>>('/crews', toRecord(params));

export const getCrew = (id: string) => apiGet<EntityResponse<CrewDetail>>(`/crews/${id}`);

export const getArcs = (params: ArcParams = {}) =>
  apiGet<ListResponse<Arc>>('/arcs', toRecord(params));

export const getArc = (id: string) => apiGet<EntityResponse<Arc>>(`/arcs/${id}`);

export const getSagas = () => apiGet<EntityResponse<Saga[]>>('/sagas');

export const getBoats = (params: BoatParams = {}) =>
  apiGet<ListResponse<Boat>>('/boats', toRecord(params));

export const getBoat = (id: string) => apiGet<EntityResponse<Boat>>(`/boats/${id}`);

export const searchCatalog = (q: string) =>
  apiGet<EntityResponse<SearchResults>>('/search', { q });

export const getStats = () => apiGet<EntityResponse<Stats>>('/stats');

export const getFilters = () => apiGet<EntityResponse<Filters>>('/filters');

export const getApiMeta = () => apiGet<EntityResponse<ApiMeta>>('/meta');

export const getHealth = () => apiGet<HealthResponse>('/health');

export function useCharacters(params: CharacterParams) {
  return useQuery({
    queryKey: ['characters', params],
    queryFn: () => getCharacters(params),
    placeholderData: keepPreviousData,
  });
}

export function useBounties(params: CharacterParams) {
  return useQuery({
    queryKey: ['bounties', params],
    queryFn: () => getBounties(params),
    placeholderData: keepPreviousData,
  });
}

export function useCharacter(id: string | undefined) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: () => getCharacter(id!),
    enabled: Boolean(id),
  });
}

export function useFruits(params: FruitParams) {
  return useQuery({
    queryKey: ['fruits', params],
    queryFn: () => getFruits(params),
    placeholderData: keepPreviousData,
  });
}

export function useFruit(id: string | undefined) {
  return useQuery({
    queryKey: ['fruit', id],
    queryFn: () => getFruit(id!),
    enabled: Boolean(id),
  });
}

export function useCrews(params: CrewParams) {
  return useQuery({
    queryKey: ['crews', params],
    queryFn: () => getCrews(params),
    placeholderData: keepPreviousData,
  });
}

export function useCrew(id: string | undefined) {
  return useQuery({
    queryKey: ['crew', id],
    queryFn: () => getCrew(id!),
    enabled: Boolean(id),
  });
}

export function useArcs(params: ArcParams) {
  return useQuery({
    queryKey: ['arcs', params],
    queryFn: () => getArcs(params),
    placeholderData: keepPreviousData,
  });
}

export function useArc(id: string | undefined) {
  return useQuery({
    queryKey: ['arc', id],
    queryFn: () => getArc(id!),
    enabled: Boolean(id),
  });
}

export function useSagas() {
  return useQuery({
    queryKey: ['sagas'],
    queryFn: getSagas,
    staleTime: 10 * 60_000,
  });
}

export function useBoats(params: BoatParams) {
  return useQuery({
    queryKey: ['boats', params],
    queryFn: () => getBoats(params),
    placeholderData: keepPreviousData,
  });
}

export function useBoat(id: string | undefined) {
  return useQuery({
    queryKey: ['boat', id],
    queryFn: () => getBoat(id!),
    enabled: Boolean(id),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => searchCatalog(q),
    enabled: q.trim().length >= 2,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    staleTime: 5 * 60_000,
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ['filters'],
    queryFn: getFilters,
    staleTime: 10 * 60_000,
  });
}

export function useApiMeta() {
  return useQuery({
    queryKey: ['api-meta'],
    queryFn: getApiMeta,
    staleTime: 10 * 60_000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 60_000,
  });
}
