import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Permite ejecutar el backend desde /backend (workspaces) o desde la raíz.
loadEnv({ path: resolve(process.cwd(), '../.env') });
loadEnv({ path: resolve(process.cwd(), '../.env.local'), override: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATA_PROVIDER: z.string().min(1).default('onepiece_multisource'),
  ONEPIECE_API_BASE_URL: z
    .string()
    .url()
    .default('https://api.api-onepiece.com/v2'),
  ONEPIECE_API_LOCALE: z.enum(['en', 'fr']).default('en'),
  ONEPIECE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  IMAGE_PROVIDER: z.enum(['onepieceapi', 'none']).default('onepieceapi'),
  ONEPIECEAPI_BASE_URL: z
    .string()
    .url()
    .default('https://www.onepieceapi.com/api'),
  ONEPIECEAPI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  ONEPIECEAPI_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(100),
  ONEPIECEAPI_MAX_PAGES: z.coerce.number().int().positive().default(60),
  IMAGE_ENRICHMENT_WAIT_MS: z.coerce.number().int().min(0).default(4000),
  CACHE_TTL_MS: z.coerce.number().int().min(0).default(600_000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  MEDIA_ALLOWED_HOSTS: z
    .string()
    .default(
      'images.api-onepiece.com,hlryizauzapedkefdviw.supabase.co',
    ),
  MEDIA_MAX_BYTES: z.coerce.number().int().positive().default(8_000_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Configuración inválida en .env:\n${details}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const allowedMediaHosts = env.MEDIA_ALLOWED_HOSTS.split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export const isTest = env.NODE_ENV === 'test';
