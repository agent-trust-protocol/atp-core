import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface RequireAuthProps {
  children: React.ReactNode;
  tier?: 'startup' | 'professional' | 'enterprise';
  feature?: string;
}

export async function RequireAuth({ children, tier = 'startup', feature }: RequireAuthProps) {
  const cookieStore = cookies();
  const token = cookieStore.get('atp_token');
  
  // Check if user is authenticated
  if (!token) {
    // Redirect to login with return URL and feature gate message
    const params = new URLSearchParams({
      returnTo: '/dashboard/workflows/designer',
      feature: feature || 'premium',
      tier: tier
    });
    redirect(`/login?${params.toString()}`);
  }
  
  // In production, you would verify the token and check subscription tier
  // For now, we'll just check if token exists
  
  return <>{children}</>;
}