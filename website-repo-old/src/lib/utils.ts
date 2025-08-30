import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

export function truncateString(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export function generateMockSignature(message: string) {
  // Generate realistic-looking mock signatures for demo
  const ed25519 = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
  
  const dilithium = Array.from({ length: 128 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
  
  const combined = btoa(ed25519 + dilithium).substring(0, 88)
  
  return { ed25519, dilithium, combined }
}

export function getTrustLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'enterprise':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'verified':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'basic':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getTrustScore(level: string): number {
  switch (level.toLowerCase()) {
    case 'enterprise':
      return 95
    case 'verified':
      return 85
    case 'basic':
      return 70
    default:
      return 50
  }
}