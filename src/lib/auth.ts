import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { Pool } from 'pg';

// BETTER_AUTH_SECRET is required at runtime in production.
// During `next build` the env is not available, so a placeholder is used for
// the build phase only — it is never used to sign real sessions.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret && !isNextBuild) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] BETTER_AUTH_SECRET environment variable is not set. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  console.warn('[auth] BETTER_AUTH_SECRET not set — using insecure dev fallback. Never use this in production.');
}

const authSecret = secret ?? 'dev-only-secret-not-for-production';

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

// PostgreSQL connection for Better Auth
const {DATABASE_URL} = process.env;

const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('sslmode=disable') || DATABASE_URL.includes('.flycast')
    ? false
    : { rejectUnauthorized: false }
}) : undefined;

export type { Session } from 'better-auth';

export const auth = betterAuth({
  secret: authSecret,
  baseURL,
  database: pool as any, // Better Auth accepts a pg Pool directly
  emailAndPassword: {
    enabled: false // Disabled - using magic link instead
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30 // 30 days
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://agenttrustprotocol.com',
    'https://www.agenttrustprotocol.com',
    process.env.NEXT_PUBLIC_APP_DOMAIN || ''
  ].filter(Boolean),
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Dynamic import to avoid circular dependency
        const { emailService } = await import('./email');
        await emailService.sendMagicLinkEmail(email, url);
      },
      expiresIn: 60 * 15 // 15 minutes
    })
  ]
});
