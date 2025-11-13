"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Atom,
  Settings,
  Users,
  BarChart3,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Play
} from "lucide-react"
import Link from 'next/link'
import { QuantumSafeSignatureDemoGated } from "@/components/atp/quantum-safe-signature-demo-gated"

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Play className="h-10 w-10 text-blue-500" />
            <h1 className="text-4xl font-bold">Interactive Demos</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience ATP's cutting-edge features through hands-on demonstrations.
            Try quantum-safe cryptography, design trust policies, and monitor performance—all in your browser.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 px-4 py-2">
              <Atom size={16} className="mr-2" />
              Quantum-Safe Cryptography
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-2">
              <Settings size={16} className="mr-2" />
              Visual Policy Design
            </Badge>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
              <Shield size={16} className="mr-2" />
              Trust Management
            </Badge>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-2">
              <BarChart3 size={16} className="mr-2" />
              Performance Monitoring
            </Badge>
          </div>
        </div>

        {/* Demo Tabs */}
        <Tabs defaultValue="signatures" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="signatures" className="flex items-center gap-2">
              <Atom className="h-4 w-4" />
              <span className="hidden sm:inline">Quantum Signatures</span>
              <span className="sm:hidden">Signatures</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Policy Editor</span>
              <span className="sm:hidden">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="trust" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Trust Management</span>
              <span className="sm:hidden">Trust</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Metrics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signatures">
            <QuantumSafeSignatureDemoGated showPreview={true} />
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Visual Policy Editor Demo</CardTitle>
                <CardDescription>Design trust policies with drag-and-drop simplicity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive demo coming soon. Contact us for early access.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trust">
            <Card>
              <CardHeader>
                <CardTitle>Trust Level Management Demo</CardTitle>
                <CardDescription>Dynamic agent registration and trust evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive demo coming soon. Contact us for early access.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics Demo</CardTitle>
                <CardDescription>Real-time system monitoring and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive demo coming soon. Contact us for early access.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Deploy ATP?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              These demonstrations show just a glimpse of ATP's capabilities.
              Get full access to production features, enterprise support, and custom integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Start Free Trial
                </CardTitle>
                <CardDescription>
                  Deploy ATP in your development environment and test with real agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Full SDK access and documentation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Up to 10,000 signatures per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Basic monitoring and alerting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Community support</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-500" />
                  Enterprise Solution
                </CardTitle>
                <CardDescription>
                  Production-ready deployment with advanced features and support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Unlimited quantum-safe operations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Advanced analytics and compliance reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>24/7 enterprise support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Custom integrations and deployment</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/enterprise">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Note */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">About These Demonstrations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All demonstrations use simulated data and sandbox environments to showcase ATP's capabilities.
                The quantum-safe cryptography demonstrations use real Ed25519 + Dilithium hybrid algorithms,
                but with demo keys for security. Production deployments use enterprise-grade key management,
                hardware security modules (HSMs), and additional security layers not shown in these demos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}