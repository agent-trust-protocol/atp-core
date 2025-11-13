"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Activity, FileText, Monitor, DollarSign, type LucideIcon } from "lucide-react"

interface QuickAccessItem {
  href: string
  label: string
  icon: LucideIcon
}

const items: QuickAccessItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/policy-editor", label: "Policy Editor", icon: FileText },
  { href: "/monitoring", label: "Monitoring", icon: Monitor },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
]

export function QuickAccess() {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-label={`Go to ${label}`}>
            <Card className="glass border-0 atp-trust-indicator hover:scale-105 transition-all duration-300 p-4 flex items-center justify-center gap-2">
              <Icon size={16} className="text-foreground/80" />
              <span className="text-sm font-medium text-foreground/90">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}


