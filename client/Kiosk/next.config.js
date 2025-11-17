/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for Electron
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable automatic static optimization for Electron
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',
};

export default nextConfig;
