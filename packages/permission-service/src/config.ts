import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3003),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL must not be empty'),
    JWT_SECRET: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).default(0),
    CACHE_TTL: z.coerce.number().int().positive().default(300),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET is required in production (set a strong random string ≥32 chars)',
      });
    }
    if (data.NODE_ENV === 'production' && data.JWT_SECRET && data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }
  });

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n[permission-service] Invalid environment configuration:\n${errors}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
