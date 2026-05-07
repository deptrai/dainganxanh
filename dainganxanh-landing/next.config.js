// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // CDN: set NEXT_PUBLIC_CDN_URL to serve static assets via CDN prefix.
  // Example: NEXT_PUBLIC_CDN_URL=https://cdn.dainganxanh.vn
  // Leave unset to serve from origin (current Dokploy setup).
  ...(process.env.NEXT_PUBLIC_CDN_URL ? { assetPrefix: process.env.NEXT_PUBLIC_CDN_URL } : {}),

  images: {
    // Skip Next.js image optimization in dev so local Supabase (127.0.0.1)
    // is not blocked by SSRF protection in /_next/image.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.transparenttextures.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
}

const sentryOptions = {
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    automaticVercelMonitors: false,
    sourcemaps: {
        // Skip source map upload when no DSN configured (local dev / CI)
        disable: !process.env.SENTRY_DSN,
    },
}

module.exports = process.env.SENTRY_DSN
    ? withSentryConfig(nextConfig, sentryOptions)
    : nextConfig

