import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { Pool } from "pg";

// Provide a secret for Better Auth — MUST be set in production
const secret = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-not-for-production');
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required in production');
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// PostgreSQL connection for Better Auth
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable is required in production');
}

const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
}) : undefined;

export const auth = betterAuth({
  secret,
  baseURL,
  database: pool as any, // Better Auth accepts a pg Pool directly
  emailAndPassword: {
    enabled: false, // Disabled - using magic link instead
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://agenttrustprotocol.com",
    "https://www.agenttrustprotocol.com",
    process.env.NEXT_PUBLIC_APP_DOMAIN || "",
  ].filter(Boolean),
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Dynamic import to avoid circular dependency
        const { emailService } = await import("./email");
        await emailService.sendMagicLinkEmail(email, url);
      },
      expiresIn: 60 * 15, // 15 minutes
    }),
  ],
});
