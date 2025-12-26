'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function PricingToggle() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up">
      <button
        onClick={() => setIsAnnual(false)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          !isAnnual
            ? 'bg-white/10 text-white'
            : 'text-muted-foreground hover:text-white'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setIsAnnual(true)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
          isAnnual
            ? 'bg-white/10 text-white'
            : 'text-muted-foreground hover:text-white'
        }`}
      >
        Annual
        <Badge className="bg-green-500/20 text-green-400 text-xs border-green-500/30">
          Save 17%
        </Badge>
      </button>
    </div>
  )
}
