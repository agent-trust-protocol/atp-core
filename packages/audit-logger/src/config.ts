import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3005),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL must not be empty'),
    IPFS_URL: z.string().optional(),
    AUDIT_ENCRYPTION_KEY: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.AUDIT_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUDIT_ENCRYPTION_KEY'],
        message: 'AUDIT_ENCRYPTION_KEY is required in production to encrypt sensitive audit data'
      });
    }
    if (data.NODE_ENV === 'production' && data.AUDIT_ENCRYPTION_KEY && data.AUDIT_ENCRYPTION_KEY.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUDIT_ENCRYPTION_KEY'],
        message: 'AUDIT_ENCRYPTION_KEY must be at least 32 characters in production'
      });
    }
  });

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n[audit-logger] Invalid environment configuration:\n${errors}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
