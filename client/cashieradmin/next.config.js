/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during production builds
    // ESLint should be run separately in CI/CD
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.render.com',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
