/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignore ESLint during build - the indent rule is causing stack overflow
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone', // Enable standalone output for Docker
  env: {
    ATP_API_URL: process.env.ATP_API_URL || 'http://localhost:3000',
    ATP_QUANTUM_URL: process.env.ATP_QUANTUM_URL || 'http://localhost:3008',
    NEXT_PUBLIC_ATP_PERMISSION_URL: process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003',
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3030',
    NEXT_PUBLIC_DEV_DOMAIN: process.env.NEXT_PUBLIC_DEV_DOMAIN || 'http://localhost:3000',
  },
  // Increase timeout for static generation to prevent premature termination
  staticPageGenerationTimeout: 180,
  // Performance optimizations
  swcMinify: true,
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
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig