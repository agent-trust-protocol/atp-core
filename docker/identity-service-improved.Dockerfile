# Production-ready multi-stage build for Identity Service
# Supports native compilation of better-sqlite3 on Alpine Linux

# Build stage with complete toolchain
FROM node:18-alpine AS builder
WORKDIR /app

# Install comprehensive build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-setuptools \
    py3-pip \
    make \
    g++ \
    gcc \
    libc-dev \
    sqlite-dev \
    linux-headers \
    git

# Set environment variables for native compilation
ENV PYTHON=python3
ENV NODE_GYP_FORCE_PYTHON=python3
ENV npm_config_build_from_source=true
ENV npm_config_cache=/tmp/.npm

# Copy package files and install dependencies
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/identity-service/package.json ./packages/identity-service/

# Install dependencies with native compilation
RUN npm ci --verbose

# Copy source code and build
COPY packages/shared ./packages/shared
COPY packages/identity-service ./packages/identity-service
COPY tsconfig.json ./

# Build the TypeScript code
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/identity-service

# Verify native modules are properly compiled
RUN ls -la node_modules/better-sqlite3/build/Release/better_sqlite3.node || \
    echo "Warning: Native SQLite3 module not found"

# Production stage - minimal runtime image
FROM node:18-alpine AS production
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    sqlite \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and compiled native modules
COPY --from=builder /app/packages/identity-service/dist ./dist
COPY --from=builder /app/packages/identity-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
# Ensure shared package is properly linked
COPY --from=builder /app/packages/shared/dist ./node_modules/@atp/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./node_modules/@atp/shared/

# Create data directory with proper permissions
RUN mkdir -p /data && chown -R nodejs:nodejs /data /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]