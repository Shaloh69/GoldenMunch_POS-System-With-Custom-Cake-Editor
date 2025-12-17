import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  webpack: (config, { isServer, webpack }) => {
    // Add path alias resolution for @/ imports
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    config.resolve.alias['@'] = path.resolve(__dirname);

    // Fix Tailwind CSS v4 compatibility with HeroUI
    // Redirect tailwindcss/plugin imports to our compatibility shim
    const shimPath = path.resolve(__dirname, 'lib/shims/tailwindcss-plugin.js');
    config.resolve.alias['tailwindcss/plugin'] = shimPath;
    config.resolve.alias['tailwindcss/plugin.js'] = shimPath;

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
