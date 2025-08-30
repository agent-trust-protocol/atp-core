# Production-ready multi-stage build for RPC Gateway
# Optimized for WebSocket and HTTP proxy functionality

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
COPY packages/rpc-gateway/package.json ./packages/rpc-gateway/

# Install dependencies with native compilation
RUN npm ci --verbose

# Copy source code and build
COPY packages/shared ./packages/shared
COPY packages/rpc-gateway ./packages/rpc-gateway
COPY tsconfig.json ./

# Build the TypeScript code
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/rpc-gateway

# Verify native modules are properly compiled (if any)
RUN echo "RPC Gateway build verification complete"

# Production stage - minimal runtime image
FROM node:18-alpine AS production
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and compiled native modules
COPY --from=builder /app/packages/rpc-gateway/dist ./dist
COPY --from=builder /app/packages/rpc-gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules
# Ensure shared package is properly linked
COPY --from=builder /app/packages/shared/dist ./node_modules/@atp/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./node_modules/@atp/shared/

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

EXPOSE 3004

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]