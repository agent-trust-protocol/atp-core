import { createAuthClient } from "better-auth/react";
import type { Session } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  user,
} = authClient;

// Helper hooks for common auth operations
export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user,
    session: session.data?.session,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
  };
}

// Type-safe session hook
export function useAuthSession() {
  return useSession() as {
    data: Session | null;
    isPending: boolean;
    error: Error | null;
  };
}
