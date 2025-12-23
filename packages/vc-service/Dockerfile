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
COPY packages/vc-service/package.json ./packages/vc-service/
COPY packages/vc-service/tsconfig.json ./packages/vc-service/

# Install all dependencies
RUN npm install

# Copy shared package source
COPY packages/shared ./packages/shared

# Copy vc service source
COPY packages/vc-service ./packages/vc-service

# Build shared package first
RUN cd packages/shared && npm run build

# Build vc service
RUN cd packages/vc-service && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/packages/vc-service/dist ./dist
COPY --from=builder /app/packages/vc-service/package.json ./
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

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]