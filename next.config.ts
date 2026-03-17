import type { NextConfig } from 'next';

const configuredApiBase =
  (process.env.NEXT_PUBLIC_LARAVEL_API_URL || process.env.LARAVEL_API_URL || '').replace(/\/+$/, '');

const configuredBackendOrigin = configuredApiBase.replace(/\/api$/, '');

function buildRemotePattern(urlValue: string) {
  if (!urlValue) {
    return null;
  }

  try {
    const parsed = new URL(urlValue);
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      port: parsed.port || '',
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const backendRemotePattern = buildRemotePattern(configuredBackendOrigin);
const localImagePatterns = [
  {
    protocol: 'http' as const,
    hostname: 'localhost',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'http' as const,
    hostname: 'localhost',
    port: '8000',
    pathname: '/**',
  },
  {
    protocol: 'http' as const,
    hostname: '127.0.0.1',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'http' as const,
    hostname: '127.0.0.1',
    port: '8000',
    pathname: '/**',
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LARAVEL_API_URL: process.env.NEXT_PUBLIC_LARAVEL_API_URL || process.env.LARAVEL_API_URL || '',
    LARAVEL_API_URL: process.env.LARAVEL_API_URL || '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      ...localImagePatterns,
      ...(backendRemotePattern ? [backendRemotePattern] : []),
      {
        protocol: 'https',
        hostname: 'nasmasr.app',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (!configuredApiBase) {
      return [];
    }

    return [
      {
        source: '/api/admin/:path*',
        destination: `${configuredApiBase}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
