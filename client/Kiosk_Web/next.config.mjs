/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED static export - Next.js will run as standalone web app on Render
  // Electron loads from remote URL instead of bundled files
  reactStrictMode: true,

  // Disable type checking during build (run these in development)
  // Note: eslint config moved to .eslintrc.json (no longer supported in next.config)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile Three.js packages for 3D cake editor
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
  ],

  // Unoptimized images for compatibility
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },

  // Standard .next directory for all builds
  distDir: '.next',

  // Disable all static optimization to avoid HeroUI SSR issues
  output: 'standalone',

  // Experimental: Skip static page generation to avoid build errors
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
