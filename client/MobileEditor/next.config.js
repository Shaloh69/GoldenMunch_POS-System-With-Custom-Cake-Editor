/** @type {import('next').NextConfig} */
const nextConfig = {
  // For production: static export to be served from Express
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true, // Required for static export
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // Serve from root path - QR codes will point to http://SERVER_IP:3001/
  trailingSlash: true,
};

module.exports = nextConfig;
