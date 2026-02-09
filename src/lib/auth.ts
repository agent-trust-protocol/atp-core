import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import path from "path";
import Database from "better-sqlite3";

// Provide a secret for Better Auth — MUST be set in production
const secret = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-not-for-production');
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required in production');
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Use absolute path for SQLite database
const dbPath = path.join(process.cwd(), "dev.db");

// Initialize better-sqlite3 database
const sqlite = new Database(dbPath);

export const auth = betterAuth({
  secret,
  baseURL,
  database: sqlite,
  emailAndPassword: {
    enabled: false, // Disabled - using magic link instead
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
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
