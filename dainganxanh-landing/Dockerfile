# Dockerfile for dainganxanh-landing Next.js app
# Build from within /d/packages/dainganxanh-landing directory

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_BANK_NAME
ARG NEXT_PUBLIC_BANK_ACCOUNT
ARG NEXT_PUBLIC_BANK_HOLDER
ARG NEXT_PUBLIC_BANK_BRANCH

# Set as environment variables for Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BANK_NAME=$NEXT_PUBLIC_BANK_NAME
ENV NEXT_PUBLIC_BANK_ACCOUNT=$NEXT_PUBLIC_BANK_ACCOUNT
ENV NEXT_PUBLIC_BANK_HOLDER=$NEXT_PUBLIC_BANK_HOLDER
ENV NEXT_PUBLIC_BANK_BRANCH=$NEXT_PUBLIC_BANK_BRANCH

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# LibreOffice for DOCX→PDF conversion (headless, no GUI)
RUN apk add --no-cache libreoffice

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# LibreOffice writes a user profile on first run — needs writable HOME
ENV HOME=/tmp

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
