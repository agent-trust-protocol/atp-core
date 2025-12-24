import dynamic from 'next/dynamic';

// Force dynamic rendering - don't prerender this page
export const dynamicSetting = 'force-dynamic';
export const revalidate = 0;

// Dynamically import client component to prevent SSR issues with Clerk
const SignupClient = dynamic(
  () => import('./client-page'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    ),
  }
);

export default function SignupPage() {
  return <SignupClient />;
}
