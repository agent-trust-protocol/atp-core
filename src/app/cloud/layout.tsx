import { cookies } from 'next/headers';
import { CloudAccessGate } from '@/components/auth/CloudAccessGate';

async function verifyToken(token: string): Promise<{ valid: boolean; user?: any; tenant?: any }> {
  try {
    // In production, this would verify the JWT token with your auth service
    const response = await fetch(`${process.env.ATP_AUTH_SERVICE_URL || 'http://localhost:3001'}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return { valid: true, user: data.user, tenant: data.tenant };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false };
  }
}

async function checkSubscriptionTier(tenant: any, requiredTier: string): Promise<boolean> {
  const tierHierarchy = {
    'startup': 1,
    'professional': 2,
    'enterprise': 3
  };

  const userTier = tenant?.plan || 'startup';
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 1;
  const requiredTierLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 1;

  return userTierLevel >= requiredTierLevel;
}

export default async function CloudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('atp_token');

  // Check if user is authenticated
  if (!token?.value) {
    return <CloudAccessGate feature="cloud-platform" tier="startup" />;
  }

  // Verify token with auth service
  const verification = await verifyToken(token.value);
  if (!verification.valid) {
    return <CloudAccessGate feature="cloud-platform" tier="startup" />;
  }

  // Check subscription tier
  const hasAccess = await checkSubscriptionTier(verification.tenant, 'startup');
  if (!hasAccess) {
    return <CloudAccessGate feature="cloud-platform" tier="startup" />;
  }

  return <>{children}</>;
}