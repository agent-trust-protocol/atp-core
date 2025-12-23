# Multi-stage build for monorepo
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 py3-setuptools make g++

# Copy root package files
COPY package*.json ./
COPY lerna.json ./
COPY tsconfig.json ./

# Copy all package.json files
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/audit-logger/package.json ./packages/audit-logger/
COPY packages/audit-logger/tsconfig.json ./packages/audit-logger/

# Install all dependencies
RUN npm install

# Copy shared package source
COPY packages/shared ./packages/shared

# Copy audit logger source
COPY packages/audit-logger ./packages/audit-logger

# Build shared package first
RUN cd packages/shared && npm run build

# Build audit logger
RUN cd packages/audit-logger && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/packages/audit-logger/dist ./dist
COPY --from=builder /app/packages/audit-logger/package.json ./
COPY --from=builder /app/packages/shared/dist ./node_modules/@atp/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@atp/shared/

# Install only production dependencies
RUN npm install --only=production --ignore-scripts

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create data directory
RUN mkdir -p /data && chown nodejs:nodejs /data

USER nodejs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

CMD ["node", "dist/index.js"]