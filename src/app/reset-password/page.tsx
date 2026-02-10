'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, Shield } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">No Password Needed</CardTitle>
          <CardDescription>
            ATP uses passwordless authentication for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Magic Link Sign-In</strong>
              <p className="mt-1 text-sm">
                Instead of passwords, we send a secure one-time link to your email.
                Click the link and you&apos;re signed in — no password to remember or reset.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              You can also sign in with Google or GitHub for one-click access.
            </p>

            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                <Mail className="w-4 h-4 mr-2" />
                Sign In with Magic Link
              </Button>
            </Link>

            <Link href="/signup" className="block">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Need help? Contact{' '}
            <a href="mailto:dev@agenttrustprotocol.com" className="text-primary hover:underline">
              dev@agenttrustprotocol.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
