"use client"

import Link from "next/link"
import Image from "next/image"
import { BrandLogo } from "@/components/ui/brand-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center min-h-16 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <BrandLogo size={32} className="" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold atp-gradient-text">ATP™</span>
              <span className="text-xs text-muted-foreground -mt-1">Agent Trust Protocol</span>
            </div>
          </Link>

          {/* Navigation Links + Theme Toggle + CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/developers"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
            >
              Developers
            </Link>
            <Link
              href="/demos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
            >
              Interactive Demos
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
            >
              Dashboard
            </Link>
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
              <Link href="/cloud">Request Access</Link>
            </Button>
            <Button asChild size="sm" className="atp-gradient-secondary text-white shadow-quantum hover:scale-105 transition-transform">
              <Link href="/enterprise">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}