/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Product surfaces (Studio, cloud, billing, enterprise) moved out of the
  // public ATP 1.x repo — redirect their old routes to the home page.
  async redirects() {
    return [
      '/dashboard',
      '/pricing',
      '/monitoring',
      '/policy-editor',
      '/policy-testing',
      '/cloud',
      '/enterprise',
    ].map((path) => ({
      source: `${path}/:path*`,
      destination: '/',
      permanent: false,
    })).concat([
      { source: '/dashboard', destination: '/', permanent: false },
      { source: '/pricing', destination: '/', permanent: false },
      { source: '/monitoring', destination: '/', permanent: false },
      { source: '/policy-editor', destination: '/', permanent: false },
      { source: '/policy-testing', destination: '/', permanent: false },
      { source: '/cloud', destination: '/', permanent: false },
      { source: '/enterprise', destination: '/', permanent: false },
      { source: '/integrations/openclaw/agents', destination: '/integrations/openclaw', permanent: false },
    ]);
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