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
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: 'https://back.nasmasr.app/api/admin/:path*',
      },
    ];
  },
};

export default nextConfig;
