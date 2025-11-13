'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    companySize: '',
    phone: '',
    useCase: '',
    agreeToTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Auto-redirect to portal (already logged in)
      setTimeout(() => {
        router.push('/portal');
        router.refresh();
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      setError('Unable to create account. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">🎉 Account Created!</CardTitle>
            <CardDescription>
              Please verify your email address to activate your trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Important:</strong> We've sent a verification link to your email.
                Click the link to verify your email and access your trial account.
              </AlertDescription>
            </Alert>

            {/* Show verification link in dev mode */}
            {error === '' && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <p className="text-sm font-semibold mb-2">Development Mode - Verification Link:</p>
                <code className="text-xs break-all block bg-white dark:bg-gray-900 p-2 rounded">
                  {formData.email}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Check the server console for the verification link, or wait for the redirect...
                </p>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Redirecting to portal in a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Start Your 14-Day Trial</CardTitle>
          <CardDescription>
            No credit card required. Full enterprise features included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            {/* Company Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) => setFormData({...formData, companySize: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Use Case */}
            <div className="space-y-2">
              <Label htmlFor="useCase">Primary Use Case</Label>
              <Select
                value={formData.useCase}
                onValueChange={(value) => setFormData({...formData, useCase: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How will you use ATP?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-agents">Securing AI Agents</SelectItem>
                  <SelectItem value="api-security">API Security</SelectItem>
                  <SelectItem value="compliance">Compliance & Audit</SelectItem>
                  <SelectItem value="integration">System Integration</SelectItem>
                  <SelectItem value="development">Development & Testing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => 
                  setFormData({...formData, agreeToTerms: checked as boolean})
                }
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
            <Alert className="bg-green-50 dark:bg-green-950">
              <AlertDescription>
                <strong>Your 14-day trial includes:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✅ 100 quantum-safe AI agents</li>
                  <li>✅ 10,000 API requests</li>
                  <li>✅ SSO/SAML integration</li>
                  <li>✅ Full API access</li>
                  <li>✅ Priority support</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !formData.agreeToTerms}
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}