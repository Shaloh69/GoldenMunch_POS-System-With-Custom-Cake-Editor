/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for Electron
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true, // Required for static export
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // Disable automatic static optimization for Electron
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',
};

export default nextConfig;
