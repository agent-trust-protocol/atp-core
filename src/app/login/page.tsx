import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LoginClient = nextDynamic(
  () => import('./client-page'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }
);

export default function LoginPage() {
  return <LoginClient />;
}
