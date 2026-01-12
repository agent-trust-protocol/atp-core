'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { signInWithMagicLink } from '@/lib/auth-client';
import { Mail, CheckCircle } from 'lucide-react';

function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [email, setEmail] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show success state after magic link is sent
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to create your account and start your 14-day trial.
            </p>
            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
              >
                Use a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Start Your 14-Day Trial</CardTitle>
          <CardDescription>
            No credit card required. Full enterprise features included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Options - HIDDEN FOR NOW
             To re-enable OAuth buttons, uncomment the code below
             Available functions: signInWithGoogle, signInWithGithub
          */}

          {/* Magic Link Sign Up */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Terms */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Trial Features */}
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertDescription>
                <strong>Your 14-day trial includes:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ 100 quantum-safe AI agents</li>
                  <li>✓ 10,000 API requests</li>
                  <li>✓ SSO/SAML integration</li>
                  <li>✓ Full API access</li>
                  <li>✓ Priority support</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading || !agreeToTerms}>
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Start Free Trial'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll email you a secure link to create your account — no password needed.
            </p>
          </form>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
