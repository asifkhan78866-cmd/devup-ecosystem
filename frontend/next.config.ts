import type { NextConfig } from 'next'

import path from 'node:path'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  turbopack: {
    root: path.resolve(),
  },
  // SEO & Performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://devup-eco.onrender.com/api/:path*',
      },
    ]
  },
  webpack: (config) => {
    config.externals = [...(config.externals || [])]
    return config
  },
}

export default nextConfig
