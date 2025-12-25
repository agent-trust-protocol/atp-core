'use client'

import * as React from 'react'
import { Moon, Sun, Monitor, Sparkles } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Return a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="glass border-atp-electric-cyan/20"
        disabled
      >
        <Sun size={20} className="opacity-50" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const getCurrentIcon = () => {
    if (theme === 'light') return Sun
    if (theme === 'dark') return Moon
    return Monitor
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="glass border-atp-electric-cyan/20 hover:bg-atp-electric-cyan/10 transition-all duration-300"
        >
          <div className="relative">
            <Sun size={20} className="rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
            <Moon size={20} className="absolute top-0 left-0 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-atp-electric-cyan/20">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer hover:bg-atp-electric-cyan/10 transition-all duration-200"
        >
          <Sun size={16} className={`mr-2 ${theme === 'light' ? 'icon-glow icon-gradient-warning' : ''}`} />
          <span>Light</span>
          {theme === 'light' && (
            <Sparkles size={12} className="ml-auto text-atp-amber icon-glow" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer hover:bg-atp-electric-cyan/10 transition-all duration-200"
        >
          <Moon size={16} className={`mr-2 ${theme === 'dark' ? 'icon-glow icon-gradient-primary' : ''}`} />
          <span>Dark</span>
          {theme === 'dark' && (
            <Sparkles size={12} className="ml-auto text-atp-electric-cyan icon-glow" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer hover:bg-atp-electric-cyan/10 transition-all duration-200"
        >
          <Monitor size={16} className={`mr-2 ${theme === 'system' ? 'animate-pulse icon-gradient-success' : ''}`} />
          <span>System</span>
          {theme === 'system' && (
            <Sparkles size={12} className="ml-auto text-atp-emerald icon-glow" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}