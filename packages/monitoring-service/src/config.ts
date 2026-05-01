import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ATP_MONITORING_PORT: z.coerce.number().int().positive().default(3005),
  // URLs to sibling ATP services (optional — monitoring degrades gracefully when absent)
  ATP_IDENTITY_URL: z.string().url().optional(),
  ATP_CREDENTIALS_URL: z.string().url().optional(),
  ATP_PERMISSIONS_URL: z.string().url().optional(),
  ATP_AUDIT_URL: z.string().url().optional(),
  ATP_GATEWAY_URL: z.string().url().optional(),
  // Webhook for alert notifications (optional)
  ATP_ALERT_WEBHOOK_URL: z.string().url().optional()
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n[monitoring-service] Invalid environment configuration:\n${errors}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
