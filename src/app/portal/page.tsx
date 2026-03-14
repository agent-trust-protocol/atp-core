import nextDynamic from 'next/dynamic';

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamically import client component to prevent SSR issues with auth
const CustomerPortalClient = nextDynamic(
  () => import('./client-page'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading portal...</div>
      </div>
    )
  }
);

export default function PortalPage() {
  return <CustomerPortalClient />;
}
