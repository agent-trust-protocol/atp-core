"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/ui/brand-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center min-h-16 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <BrandLogo size={32} className="" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold atp-gradient-text">ATP™</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Agent Trust Protocol</span>
            </div>
          </Link>

          {/* Navigation Links + Theme Toggle + CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/developers"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Developers
            </Link>
            <Link
              href="/demos"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Interactive Demos
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Dashboard
            </Link>
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Link href="/cloud">Request Access</Link>
            </Button>
            <Button asChild size="sm" className="atp-gradient-secondary text-white shadow-lg hover:scale-105 transition-transform">
              <Link href="/enterprise">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}