import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HTTPS_PORT: z.coerce.number().int().positive().default(3443),
  WS_PORT: z.coerce.number().int().positive().default(8081),
  // Optional: path to TLS config file; when present, mTLS is enabled
  TLS_CONFIG_PATH: z.string().optional()
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n[rpc-gateway] Invalid environment configuration:\n${errors}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
