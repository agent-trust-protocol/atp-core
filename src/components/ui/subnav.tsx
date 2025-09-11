"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronRight, Home } from 'lucide-react'

export interface SubnavTab {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface SubnavBreadcrumb {
  label: string
  href?: string
}

interface SubnavProps {
  tabs?: SubnavTab[]
  breadcrumbs?: SubnavBreadcrumb[]
  variant?: 'tabs' | 'breadcrumbs' | 'both'
  className?: string
}

export function Subnav({ tabs, breadcrumbs, variant = 'tabs', className }: SubnavProps) {
  const pathname = usePathname()
  
  return (
    <div
      className={cn(
        "border-b border-border/50 bg-gradient-to-r from-background via-[hsl(var(--atp-surface))] to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        {(variant === 'breadcrumbs' || variant === 'both') && breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground py-3">
            <Link 
              href="/" 
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-1">
                <ChevronRight className="h-4 w-4" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        
        {/* Tabs */}
        {variant === 'tabs' || variant === 'both' ? (
          <div className="flex flex-wrap gap-2 py-2">
            {tabs?.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
