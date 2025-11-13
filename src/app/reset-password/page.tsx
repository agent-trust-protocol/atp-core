'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
          <CardDescription>Temporary password reset instructions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Email-based password reset is coming soon!</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-4 text-sm">
            <p className="font-semibold">For now, please use the command-line password reset tool:</p>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-xs">
              <div className="space-y-2">
                <div>cd "/Volumes/My Passport for Mac/agent-trust-protocol-1"</div>
                <div>PATH="/usr/local/bin:$PATH" node reset-password.js</div>
              </div>
            </div>

            <div className="space-y-2">
              <p><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open Terminal on your Mac</li>
                <li>Copy and paste the commands above</li>
                <li>Enter your email address</li>
                <li>Enter a new password (min 8 characters)</li>
                <li>Confirm your password</li>
              </ol>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              <strong>Alternative:</strong> You can also create a new account if you prefer.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <Link href="/login" className="text-primary hover:underline text-sm block">
              ← Back to Login
            </Link>
            <Link href="/signup" className="text-primary hover:underline text-sm block">
              Create New Account →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
