'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/portal';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in to ATP</CardTitle>
          <CardDescription>Agent Trust Protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            afterSignInUrl={returnTo}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none bg-transparent",
              },
            }}
          />
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
      <LoginContent />
    </Suspense>
  );
}
