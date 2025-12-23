"use client"

import Link from "next/link"
import Image from "next/image"
import { Shield, Menu, X, Home, BarChart3, FileText, Settings, DollarSign, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { useState } from "react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/policy-editor", label: "Policy Editor", icon: FileText },
    { href: "/policies", label: "Policies", icon: Settings },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/enterprise", label: "Enterprise", icon: Building },
  ]

  return (
    <nav className="glass border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <Image
                src="/atp-logo.png"
                alt="ATP Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold atp-gradient-text">ATP™</span>
              <span className="text-xs text-muted-foreground -mt-1">Agent Trust Protocol</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-foreground/70 hover:text-primary font-medium transition-all duration-300 hover:scale-105"
              >
                <AnimatedIcon 
                  icon={item.icon} 
                  size={16} 
                  animate="none" 
                  interactive={false}
                />
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-primary/10"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-foreground/70 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-300 rounded-md mx-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <AnimatedIcon 
                  icon={item.icon} 
                  size={18} 
                  animate="none" 
                  interactive={false}
                />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}