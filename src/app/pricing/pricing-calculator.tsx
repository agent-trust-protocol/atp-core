'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const TIERS = [
  { name: 'Open Source', maxAgents: 10, maxRequests: 5000, price: 0, recommended: false },
  { name: 'Startup', maxAgents: 25, maxRequests: 25000, price: 250, recommended: false },
  { name: 'Professional', maxAgents: 100, maxRequests: 250000, price: 1500, recommended: false },
  { name: 'Enterprise', maxAgents: 1000, maxRequests: 2500000, price: 4167, recommended: true },
]

export function PricingCalculator() {
  const [agents, setAgents] = useState(10)
  const [requests, setRequests] = useState(5000)

  const recommendedTier = TIERS.find(tier =>
    agents <= tier.maxAgents && requests <= tier.maxRequests
  ) || TIERS[TIERS.length - 1]

  return (
    <Card className="glass border border-border/50 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="h-5 w-5 text-cyan-500" />
          Find Your Perfect Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agents Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Number of Agents</span>
              <span className="font-semibold atp-gradient-text">{agents.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={agents}
              onChange={(e) => setAgents(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>500+</span>
            </div>
          </div>

          {/* Requests Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly API Requests</span>
              <span className="font-semibold atp-gradient-text">{requests.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={requests}
              onChange={(e) => setRequests(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1K</span>
              <span>500K+</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Recommended Plan:</span>
                <Badge className="atp-gradient-primary text-white">
                  {recommendedTier.name}
                </Badge>
              </div>
              <p className="text-2xl font-bold atp-gradient-text">
                {recommendedTier.price === 0 ? 'Free' : `$${recommendedTier.price.toLocaleString()}/mo`}
              </p>
            </div>
            <Button asChild className="atp-gradient-primary hover:scale-105 transition-all">
              <Link href={recommendedTier.price === 0 ? "https://github.com/agent-trust-protocol/core" : "/enterprise/contact"}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
