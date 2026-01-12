'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { signInWithMagicLink } from '@/lib/auth-client';
import { Mail, CheckCircle } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/portal';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
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
              Click the link in your email to sign in. The link expires in 15 minutes.
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Enterprise Portal</CardTitle>
          <CardDescription>Sign in to manage your ATP subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth/SSO Options - HIDDEN FOR NOW
             To re-enable OAuth buttons, uncomment the code below
             Available functions: signInWithGoogle, signInWithGithub
          */}

          {/* Magic Link Login */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll email you a secure link to sign in — no password needed.
            </p>
          </form>

          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Start 14-day trial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
