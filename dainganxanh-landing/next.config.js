/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // CDN: set NEXT_PUBLIC_CDN_URL to serve static assets via CDN prefix.
  // Example: NEXT_PUBLIC_CDN_URL=https://cdn.dainganxanh.vn
  // Leave unset to serve from origin (current Dokploy setup).
  ...(process.env.NEXT_PUBLIC_CDN_URL ? { assetPrefix: process.env.NEXT_PUBLIC_CDN_URL } : {}),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.transparenttextures.com',
      },
    ],
  },

  // Disable type checking during build (handled by Nx)
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

