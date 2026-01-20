import type { Metadata, Viewport } from 'next'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'
import '@/styles/atp-theme.css'

// Font variables - using CSS fallback stack instead of remote fonts
const fontStyles = {
  '--font-inter': 'sans-serif',
  '--font-inter-tight': 'sans-serif',
  '--font-jetbrains-mono': 'monospace',
} as React.CSSProperties

export const metadata: Metadata = {
  title: 'Agent Trust Protocol™ - Quantum-Safe AI Security',
  description: 'World\'s First Quantum-Safe AI Agent Protocol - Enterprise-grade security with glassmorphic UI, visual policy editor, and real-time monitoring.',
  keywords: [
    'AI agents',
    'quantum-safe',
    'cryptography',
    'trust protocol',
    'security',
    'Ed25519',
    'Dilithium',
    'post-quantum',
    'glassmorphism',
    'enterprise'
  ],
  authors: [{ name: 'Agent Trust Protocol Team' }],
  openGraph: {
    title: 'ATP™ - Quantum-Safe AI Agent Protocol',
    description: 'Enterprise quantum-safe security for AI agents',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A2463' },
    { media: '(prefers-color-scheme: dark)', color: '#00D9FF' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('atp-ui-theme') || 'light';
                const root = document.documentElement;

                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else {
                  root.classList.add(theme);
                }
              } catch (e) {
                // Fallback to light mode if there's an error
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" style={fontStyles} suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" storageKey="atp-ui-theme">
          <Navbar />
          <main className="relative">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}