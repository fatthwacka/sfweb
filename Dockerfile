# Multi-stage build for SlyFox Studios
# Supports both Intel and Apple Silicon architectures

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --only=production && npm cache clean --force

# Development dependencies for build stage
FROM base AS deps-dev
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json ./
RUN npm install && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# Build client and server
RUN npm run build

# Development image
FROM base AS development
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

EXPOSE 5000
ENV PORT 5000
ENV NODE_ENV development

CMD ["npm", "run", "dev"]

# Production image
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Copy server data directory for configuration persistence
COPY --from=builder /app/server ./server

# Set the correct permissions for configuration directory
RUN mkdir -p ./server/data
RUN chown -R nextjs:nodejs ./server

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

USER nextjs

EXPOSE 5000

ENV PORT 5000
ENV NODE_ENV production

CMD ["npm", "start"]