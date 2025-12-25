'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Lock, Mail, Building, User, CheckCircle, Shield } from 'lucide-react';

export default function RequestAccessPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    companySize: '',
    role: '',
    useCase: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to submit request. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Request access error:', err);
      setError('Unable to submit request. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Request Submitted</CardTitle>
            <CardDescription className="mt-2">
              Thank you for your interest in Agent Trust Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Our team will review your request</li>
                  <li>You'll receive an email with demo login credentials</li>
                  <li>Access will be granted within 1-2 business days</li>
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              We'll send login information to <strong>{formData.email}</strong> once your request is approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-20 atp-quantum-glow rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/15 dark:to-secondary/15 flex items-center justify-center border border-primary/20 dark:border-cyan-400/30">
              <BrandLogo variant="lockup" size={200} className="animate-in zoom-in-50 duration-1000" alt="Agent Trust Protocol Official Logo" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">Private Access Only</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Agent Trust Protocol is currently in private beta. Request access to test our quantum-safe AI agent security platform.
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Request Demo Access
            </CardTitle>
            <CardDescription>
              Fill out the form below and we'll send you demo login credentials
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
                  <Label htmlFor="firstName">
                    <User className="h-4 w-4 inline mr-1" />
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    placeholder="John"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Business Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              {/* Company Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">
                    <Building className="h-4 w-4 inline mr-1" />
                    Company Name *
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    required
                    placeholder="Your Company Inc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size *</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => setFormData({...formData, companySize: value})}
                    required
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

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Your Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cto">CTO / Technical Lead</SelectItem>
                    <SelectItem value="developer">Developer / Engineer</SelectItem>
                    <SelectItem value="security">Security Professional</SelectItem>
                    <SelectItem value="product">Product Manager</SelectItem>
                    <SelectItem value="founder">Founder / CEO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Use Case */}
              <div className="space-y-2">
                <Label htmlFor="useCase">Primary Use Case *</Label>
                <Select
                  value={formData.useCase}
                  onValueChange={(value) => setFormData({...formData, useCase: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How will you use ATP?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-agents">Securing AI Agents</SelectItem>
                    <SelectItem value="api-security">API Security</SelectItem>
                    <SelectItem value="compliance">Compliance & Audit</SelectItem>
                    <SelectItem value="integration">System Integration</SelectItem>
                    <SelectItem value="evaluation">Product Evaluation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Additional Information (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your specific needs or questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                />
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  <strong>Why private access?</strong>
                  <p className="text-sm mt-1">
                    We're protecting our intellectual property while allowing qualified users to evaluate ATP. 
                    Demo credentials will be sent via email after review.
                  </p>
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? 'Submitting Request...' : 'Request Demo Access'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          By requesting access, you agree to use ATP solely for evaluation purposes. 
          Unauthorized access or sharing of credentials is prohibited.
        </p>
      </div>
    </div>
  );
}

