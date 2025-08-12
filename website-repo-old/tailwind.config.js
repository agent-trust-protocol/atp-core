/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ATP Quantum-Safe Color System
        atp: {
          'quantum-blue': 'hsl(var(--atp-quantum-blue))',
          'electric-cyan': 'hsl(var(--atp-electric-cyan))',
          'emerald': 'hsl(var(--atp-emerald))',
          'amber': 'hsl(var(--atp-amber))',
          'crimson': 'hsl(var(--atp-crimson))',
          'midnight': 'hsl(var(--atp-midnight))',
          'navy': 'hsl(var(--atp-navy))',
        },
        // Glass morphism colors
        glass: {
          'bg': 'var(--glass-bg)',
          'border': 'var(--glass-border)',
          'shadow': 'var(--glass-shadow)',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "quantum-pulse": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.7, transform: "scale(1.05)" },
        },
        "trust-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0, 217, 255, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 217, 255, 0.6)" },
        },
        "secure-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "50%": { boxShadow: "0 0 0 20px rgba(16, 185, 129, 0)" },
        },
        "gradient-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "quantum-pulse": "quantum-pulse 2s ease-in-out infinite",
        "trust-glow": "trust-glow 3s ease-in-out infinite",
        "secure-pulse": "secure-pulse 2s ease-in-out infinite",
        "gradient-rotate": "gradient-rotate 8s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter Tight', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(15, 23, 42, 0.4)',
        'glass-lg': '0 25px 50px rgba(15, 23, 42, 0.6)',
        'quantum': '0 0 20px rgba(0, 217, 255, 0.3)',
        'quantum-lg': '0 0 40px rgba(0, 217, 255, 0.4)',
        'trust': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}