/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds (Electron)
  // Development mode needs dynamic rendering
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true, // Required for static export
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // Use .next for dev, out for production
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',
};

export default nextConfig;
