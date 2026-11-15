import { z } from 'zod';
import { ValidationError } from '../utils/http-error';

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  search: z.string().trim().min(1).max(100).optional(),
};

export const characterQuerySchema = z.object({
  ...pagination,
  sort: z
    .enum(['bounty_desc', 'bounty_asc', 'name_asc', 'name_desc', 'id_asc'])
    .optional(),
  crew: z.coerce.number().int().positive().optional(),
  status: z.enum(['alive', 'deceased', 'unknown']).optional(),
  hasBounty: z.enum(['true', 'false']).optional(),
});

export const fruitQuerySchema = z.object({
  ...pagination,
  sort: z.enum(['name_asc', 'name_desc', 'id_asc']).optional(),
  type: z.string().trim().min(1).max(60).optional(),
});

export const crewQuerySchema = z.object({
  ...pagination,
  sort: z.enum(['bounty_desc', 'bounty_asc', 'name_asc', 'name_desc']).optional(),
  status: z.enum(['active', 'inactive', 'dissolved', 'unknown']).optional(),
});

export const arcQuerySchema = z.object({
  ...pagination,
  saga: z.coerce.number().int().positive().optional(),
});

export const boatQuerySchema = z.object({
  ...pagination,
  sort: z.enum(['name_asc', 'name_desc', 'id_asc']).optional(),
  crew: z.coerce.number().int().positive().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'La búsqueda debe tener al menos 2 caracteres.').max(100),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const mediaQuerySchema = z.object({
  src: z.string().url('La URL de la imagen no es válida.'),
});

export type CharacterQueryInput = z.infer<typeof characterQuerySchema>;
export type FruitQueryInput = z.infer<typeof fruitQuerySchema>;
export type CrewQueryInput = z.infer<typeof crewQuerySchema>;
export type ArcQueryInput = z.infer<typeof arcQuerySchema>;
export type BoatQueryInput = z.infer<typeof boatQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/** Valida datos con Zod y lanza un error HTTP 400 legible. */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      'Parámetros de la petición inválidos.',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(raíz)',
        message: issue.message,
      })),
    );
  }
  return result.data as z.output<S>;
}

/** Convierte :id en entero positivo o lanza 400. */
export function parseId(raw: string | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) {
    throw new ValidationError('El identificador debe ser un número entero positivo.');
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ValidationError('El identificador debe ser un número entero positivo.');
  }
  return id;
}
