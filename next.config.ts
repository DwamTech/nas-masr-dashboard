import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'back.nasmasr.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nasmasr.app',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
