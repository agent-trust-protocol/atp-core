import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL must not be empty'),
    SESSION_SECRET: z.string().optional(),
    CORS_ORIGIN: z.string().default('http://localhost:3000')
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET is required in production (set a strong random string ≥32 chars)'
      });
    }
    if (data.NODE_ENV === 'production' && data.SESSION_SECRET && data.SESSION_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET must be at least 32 characters in production'
      });
    }
  });

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n[identity-service] Invalid environment configuration:\n${errors}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
