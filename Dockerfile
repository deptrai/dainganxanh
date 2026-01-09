# Dockerfile for Dokploy - builds from packages/dainganxanh-landing
# Context: repo root (.)
# This file should be at repo root for Dokploy to find it

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files from subdirectory
COPY packages/dainganxanh-landing/package.json ./package.json
COPY packages/dainganxanh-landing/yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/dainganxanh-landing .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
# Force rebuild - 2026-01-09 16:43:38
