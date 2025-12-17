/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: eslint config removed (deprecated in Next.js 16)
  // Linting no longer runs during builds by default
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
