import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Provide a secret for Better Auth
// In production runtime, BETTER_AUTH_SECRET should be set in environment variables
// During build/static generation, we use a placeholder to avoid warnings
const secret = process.env.BETTER_AUTH_SECRET ||
  'build-time-placeholder-replace-with-env-var-in-production';

// Use Better Auth's built-in database handling
export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3030",
  database: {
    provider: "sqlite",
    url: "./dev.db",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
    "http://localhost:3030",
    "https://agenttrustprotocol.com",
    process.env.NEXT_PUBLIC_APP_DOMAIN || "",
  ].filter(Boolean),
  plugins: [nextCookies()],
});
