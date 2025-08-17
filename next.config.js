/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Disable static optimization for pages with client components
  experimental: {
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig