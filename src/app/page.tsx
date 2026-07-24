import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

import {
  Shield,
  FileText,
  ArrowRight,
  Network,
  Lock,
  Eye,
  CheckCircle,
  Code2,
  Fingerprint,
  Scale,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuantumSafeSignatureDemoLite } from '@/components/atp/quantum-safe-signature-demo-lite';

const MODULES = [
  {
    href: '/specs/did-atp/',
    icon: Fingerprint,
    pillar: 'Identity',
    title: 'Agent Identity',
    description:
      'The did:atp method — a quantum-safe DID binding a classical Ed25519 key and a post-quantum ML-DSA-65 key in one identifier, with controller, issuer, and runtime binding.',
  },
  {
    href: '/specs/atp-capability/',
    icon: Code2,
    pillar: 'Authorization',
    title: 'Capability Request',
    description:
      'One standard request envelope for every guarded action: tool calls, A2A invocations, resource access, and delegated actions.',
  },
  {
    href: '/specs/atp-capability/#policy-decision',
    icon: Scale,
    pillar: 'Authorization',
    title: 'Policy Decision',
    description:
      'A normalized, deny-by-default decision — allow, deny, throttle, or require-approval — with reason codes, policy references, and obligations.',
  },
  {
    href: '/specs/atp-trust/',
    icon: Shield,
    pillar: 'Trust',
    title: 'Trust Evidence',
    description:
      'Bounded, fail-closed trust levels attested as signed W3C Verifiable Credentials, so relying parties can gate on verified trust.',
  },
  {
    href: '/specs/atp-conformance/',
    icon: Link2,
    pillar: 'Audit',
    title: 'Audit Anchoring',
    description:
      'Hash-chained, tamper-evident audit evidence with a backend-agnostic anchoring interface — no single anchor backend is mandated.',
  },
  {
    href: '/specs/atp-interop/',
    icon: Network,
    pillar: 'Interop',
    title: 'Interop Profiles',
    description:
      'Normative bindings of the trust plane to MCP servers, A2A invocation, local agent frameworks, and multi-agent orchestration.',
  },
];

const QUESTIONS = [
  {
    icon: Fingerprint,
    q: 'Who is this agent?',
    a: 'Every agent holds a quantum-safe decentralized identifier (did:atp) with verifiable key material and runtime binding.',
  },
  {
    icon: Scale,
    q: 'What action, under which policy?',
    a: 'Every guarded action is a standard Capability Request, evaluated deny-by-default into a normalized Policy Decision.',
  },
  {
    icon: Eye,
    q: 'What proof is emitted?',
    a: 'Every request, decision, and outcome becomes signed, hash-chained evidence that any party can independently verify.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Hero */}
      <div className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-28 relative">
          <div className="text-center max-w-4xl mx-auto space-y-10">
            <div className="flex items-center justify-center mb-6 animate-fade-in-up">
              <BrandLogo variant="lockup" size={280} alt="Agent Trust Protocol™ Official Logo" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight leading-tight animate-fade-in-up text-foreground dark:text-white">
              The Open <span className="atp-gradient-text font-semibold">Trust Standard</span>
              <br />
              for AI Agents
            </h1>
            <p className="text-lg sm:text-xl text-foreground/90 dark:text-gray-200 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              Agent Trust Protocol (ATP) 1.x standardizes the minimum interoperable trust
              plane for autonomous agents: <strong>identity</strong>, <strong>trust claims</strong>,{' '}
              <strong>policy decisions</strong>, and <strong>verifiable audit evidence</strong> —
              built on W3C DIDs and Verifiable Credentials, secured with post-quantum cryptography.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up">
              <Badge variant="outline" className="px-4 py-2 text-sm">Open Standard</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Quantum-Safe</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">W3C Community Group Drafts</Badge>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
              <Button asChild size="lg">
                <Link href="/specs/">
                  Read the Specifications <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">Implementer Docs</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/playground">Try the Playground</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Three protocol questions */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-light">Three Questions, One Protocol</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            ATP 1.x exists to give every agent interaction an interoperable answer to three questions.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {QUESTIONS.map(({ icon: Icon, q, a }) => (
            <Card key={q} className="glass border-0">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="font-display text-xl">{q}</CardTitle>
                <CardDescription className="text-base">{a}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Six modules */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-light">The Six ATP 1.x Modules</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            A small, complete standards spine. Each module is an open specification draft
            backed by a runnable reference implementation and conformance vectors.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {MODULES.map(({ href, icon: Icon, pillar, title, description }) => (
            <Link key={title} href={href}>
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{pillar}</span>
                  </div>
                  <CardTitle className="font-display text-lg">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Conformance */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="glass border-0 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                <CardTitle className="font-display text-2xl">Provably Interoperable</CardTitle>
              </div>
              <CardDescription className="text-base max-w-2xl mx-auto">
                Every normative claim is exercised by a public conformance suite — DID lifecycle,
                hybrid post-quantum signatures, deny-by-default policy evaluation, audit-chain
                tamper detection, and selective disclosure — with published test vectors any
                independent implementation can run.
              </CardDescription>
              <div className="pt-4">
                <code className="text-sm bg-muted px-3 py-1.5 rounded">npm run conformance</code>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Live demo */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-light">Quantum-Safe Signatures, Live</h2>
          <p className="text-muted-foreground mt-2">
            Hybrid Ed25519 + ML-DSA-65 signing — the primitive underneath every did:atp identity.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <QuantumSafeSignatureDemoLite />
        </div>
      </section>

      {/* Integrations + community */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="glass border-0">
            <CardHeader>
              <Network className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="font-display text-xl">Bring Your Runtime</CardTitle>
              <CardDescription className="text-base">
                Interop profiles bind ATP to MCP servers, A2A invocation, and agent frameworks.
                Adapters map — profiles decide: no policy is ever hard-coded in an integration.
              </CardDescription>
              <div className="pt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/integrations/openclaw">Explore Integrations <ArrowRight className="ml-2 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
          <Card className="glass border-0">
            <CardHeader>
              <FileText className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="font-display text-xl">Shape the Standard</CardTitle>
              <CardDescription className="text-base">
                The drafts are open for review in the ATP Community Group. Open issues, propose
                vectors, or bring an independent implementation to the conformance suite.
              </CardDescription>
              <div className="pt-3 flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="https://github.com/agent-trust-protocol/atp-core">GitHub</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/specs/">Specification Index</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
        <h2 className="font-display text-3xl font-light mb-3">Start Implementing ATP 1.x</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          Install the SDK, register a did:atp identity, wrap your first tool, and verify your
          implementation against the public vectors.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/docs">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/examples">Examples</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
