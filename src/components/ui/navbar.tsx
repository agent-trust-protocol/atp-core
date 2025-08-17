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

          {/* Theme Toggle + Contact Sales CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" className="atp-gradient-secondary text-white shadow-quantum hover:scale-105 transition-transform">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}