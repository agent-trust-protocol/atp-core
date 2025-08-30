/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ATP_API_URL: process.env.ATP_API_URL || 'http://localhost:3000',
    ATP_QUANTUM_URL: process.env.ATP_QUANTUM_URL || 'http://localhost:3008',
  },
  // Increase timeout for static generation to prevent premature termination
  staticPageGenerationTimeout: 180,
  // Disable static optimization for pages with client components
  experimental: {
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig