import TallyForm from '@/components/TallyForm';

export const metadata = {
  title: 'Get Access | Agent Trust Protocol',
  description: 'Request access to Agent Trust Protocol — the open-source security layer for AI agents.'
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Get Access to ATP
          </h1>
          <p className="text-muted-foreground text-base">
            Join developers and security teams already building with the Agent Trust Protocol.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <TallyForm />
        </div>
      </div>
    </main>
  );
}
