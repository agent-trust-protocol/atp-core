FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files and workspace config
COPY package*.json ./
COPY lerna.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared/
COPY packages/protocol-integrations ./packages/protocol-integrations/

# Install all dependencies from root
RUN npm install

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build protocol integrations
WORKDIR /app/packages/protocol-integrations
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose ports
EXPOSE 3006 3007 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

# Start the service
CMD ["node", "dist/index.js"]