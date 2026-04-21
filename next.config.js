/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // ESLint runs separately in CI (ci.yml) — skip during next build to
  // prevent warnings from blocking Vercel deployments.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript type-checking also runs in CI — skip during build for speed.
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    ATP_API_URL: process.env.ATP_API_URL || 'http://localhost:3000',
    ATP_QUANTUM_URL: process.env.ATP_QUANTUM_URL || 'http://localhost:3008',
    NEXT_PUBLIC_ATP_PERMISSION_URL: process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003',
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3030',
    NEXT_PUBLIC_DEV_DOMAIN: process.env.NEXT_PUBLIC_DEV_DOMAIN || 'http://localhost:3000',
  },
  // Serve installer scripts as plain text for curl/irm piping
  async headers() {
    return [
      {
        source: '/install.sh',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }]
      },
      {
        source: '/install.ps1',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }]
      }
    ];
  },
  // Increase timeout for static generation to prevent premature termination
  staticPageGenerationTimeout: 180,
  // Optimize module resolution
  modularizeImports: {
    '@radix-ui': {
      transform: '@radix-ui/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

module.exports = nextConfig