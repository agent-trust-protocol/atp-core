import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Use Better Auth's built-in database handling
export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  trustedOrigins: ["http://localhost:3030"],
  plugins: [nextCookies()],
});
