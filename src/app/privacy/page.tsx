import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you use the Agent Trust Protocol™ (&quot;ATP&quot;) platform, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Account Information:</strong> Email address and name (provided via magic link sign-in or OAuth)</li>
                <li><strong>Usage Data:</strong> API call metadata, feature usage patterns, and session information</li>
                <li><strong>Technical Data:</strong> Browser type, IP address, device information, and access logs</li>
                <li><strong>Agent Data:</strong> Agent configurations, policy definitions, and trust scores you create</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Process transactions and send billing-related communications</li>
                <li>Send service updates, security alerts, and support messages</li>
                <li>Monitor usage for capacity planning and abuse prevention</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Quantum-safe cryptographic protocols for data in transit</li>
                <li>Encryption at rest for all stored data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Role-based access controls for internal systems</li>
                <li>Session management with secure, httpOnly cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">4. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Service Providers:</strong> Email delivery (Resend), analytics, and infrastructure providers</li>
                <li><strong>OAuth Providers:</strong> Google and GitHub for authentication (only authentication tokens, not your ATP data)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication session management
                (<code className="text-xs bg-muted px-1 py-0.5 rounded">better-auth.session_token</code>)
                and theme preferences (<code className="text-xs bg-muted px-1 py-0.5 rounded">atp-ui-theme</code>).
                We do not use third-party tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for optional data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain account data for the duration of your account. Usage logs are
                retained for 90 days. Audit trail data is retained for 1 year.
                Upon account deletion, personal data is removed within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is not directed at children under 16. We do not knowingly
                collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this policy from time to time. We will notify you of
                material changes via email or a notice on the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">10. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related inquiries, contact us at{' '}
                <a href="mailto:llewis@agenttrustprotocol.com" className="text-primary hover:underline">
                  llewis@agenttrustprotocol.com
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
