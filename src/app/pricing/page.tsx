import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Agent Trust Protocol™',
  description: 'ATP is open source and free to self-host. Talk to sales for managed Cloud and Enterprise plans.'
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
          Pricing is being updated
        </span>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Open source, forever free.
          <br className="hidden sm:block" />
          Managed plans on the way.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-300">
          Every ATP primitive — identity, policy evaluation, quantum-safe signing, and the audit trail — is MIT-licensed and free to self-host. We&apos;re rebuilding our Cloud and Enterprise pricing; in the meantime, talk to sales for managed deployments.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="h-12 px-6">
            <Link
              href="https://github.com/agent-trust-protocol/atp-core"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              Start with open source
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <Link href="/enterprise">
              Talk to sales
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Already using ATP and need a quote? Email{' '}
          <a
            href="mailto:sales@agenttrustprotocol.com"
            className="underline underline-offset-4 hover:text-foreground"
          >
            sales@agenttrustprotocol.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
