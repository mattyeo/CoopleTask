import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:8081'),
  COOPLE_BASE_URL: z
    .url()
    .default('https://www.coople.com/ch/resources/api/work-assignments/public-jobs'),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(1).default(8000),
});

export interface AppConfig {
  port: number;
  corsOrigin: string;
  coopleBaseUrl: string;
  upstreamTimeoutMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return {
    port: parsed.data.PORT,
    corsOrigin: parsed.data.CORS_ORIGIN,
    coopleBaseUrl: parsed.data.COOPLE_BASE_URL,
    upstreamTimeoutMs: parsed.data.UPSTREAM_TIMEOUT_MS,
  };
}
