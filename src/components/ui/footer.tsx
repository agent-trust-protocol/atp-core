import Link from 'next/link'
import { Separator } from './separator'
import { Badge } from './badge'
import Image from 'next/image'
import { BrandLogo } from '@/components/ui/brand-logo'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full border-t bg-gradient-to-b from-background to-[hsl(var(--atp-surface))]">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                <BrandLogo size={28} />
              </div>
              <div>
                <span className="font-bold text-xl">Agent Trust Protocol™</span>
                <p className="text-sm text-muted-foreground">Quantum-Safe AI Security</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              World's first quantum-safe AI agent protocol. Enterprise-grade security with visual policy editor.
            </p>
            <Badge variant="secondary" className="bg-[hsl(var(--atp-quantum))]/10 text-[hsl(var(--atp-quantum))] border-[hsl(var(--atp-quantum))]/20 text-xs w-fit">
              🔒 Quantum-Safe
            </Badge>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/policy-editor" className="text-muted-foreground hover:text-foreground transition-colors">
                  Policy Editor
                </Link>
              </li>
              <li>
                <Link href="/monitoring" className="text-muted-foreground hover:text-foreground transition-colors">
                  Monitoring
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Enterprise</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/enterprise" className="text-muted-foreground hover:text-foreground transition-colors">
                  Enterprise Features
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Sales
                </Link>
              </li>
              <li>
                <Link href="/policies" className="text-muted-foreground hover:text-foreground transition-colors">
                  Policy Library
                </Link>
              </li>
              <li>
                <Link href="/policy-testing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Policy Testing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/agent-trust-protocol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/api-reference" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© {currentYear} Agent Trust Protocol™. All rights reserved.</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
