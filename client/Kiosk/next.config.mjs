/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds (Electron)
  // Development mode needs dynamic rendering
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  reactStrictMode: true,
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
  images: {
    unoptimized: true, // Required for static export
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
  // Use .next for dev, out for production
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',
};

export default nextConfig;
