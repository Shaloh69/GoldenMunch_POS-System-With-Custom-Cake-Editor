/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED static export - Next.js will run as standalone web app on Render
  // Electron loads from remote URL instead of bundled files
  reactStrictMode: true,

  // Disable linting/type checking during build (run these in development)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // CRITICAL: Transpile HeroUI packages to fix RSC module errors
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@heroui/theme',
    '@heroui/system',
    '@heroui/system-rsc',
    '@heroui/react-rsc-utils',
  ],

  // Unoptimized images for compatibility
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    // Fix for HeroUI RSC modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@heroui/system-rsc': '@heroui/system',
      '@heroui/react-rsc-utils': '@heroui/react-utils',
    };
    return config;
  },

  // Standard .next directory for all builds
  distDir: '.next',

  // Experimental: Skip static page generation to avoid build errors
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
