import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using the Agent Trust Protocol™ (&quot;ATP&quot;) platform, website, APIs,
                and related services (collectively, the &quot;Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                ATP provides quantum-safe security protocols, AI agent identity management,
                trust scoring, policy evaluation, and related developer tools for building
                secure AI agent systems. The Service includes web-based dashboards, APIs,
                SDKs, and documentation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may register for an account using email-based magic link authentication
                or supported OAuth providers (Google, GitHub). You are responsible for
                maintaining the security of your account and all activities under it.
                You must provide accurate information during registration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">4. Free Trial</h2>
              <p className="text-muted-foreground leading-relaxed">
                New accounts receive a 14-day free trial with access to enterprise features.
                After the trial period, continued access requires a paid subscription.
                We reserve the right to modify trial terms at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service infrastructure</li>
                <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to develop competing products</li>
                <li>Exceed published API rate limits without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. API Usage</h2>
              <p className="text-muted-foreground leading-relaxed">
                API keys are confidential and must not be shared publicly. You are
                responsible for all API calls made using your keys. We reserve the right
                to throttle or suspend access if usage patterns indicate abuse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service, including all software, documentation, and content, is the
                property of Agent Trust Protocol and protected by intellectual property laws.
                Open-source components are governed by their respective licenses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT
                SHALL ATP BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL
                DAMAGES ARISING FROM USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access at any time for violation of these
                terms. You may delete your account at any time by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">10. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@agenttrustprotocol.com" className="text-primary hover:underline">
                  legal@agenttrustprotocol.com
                </a>{' '}
                or visit our{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
