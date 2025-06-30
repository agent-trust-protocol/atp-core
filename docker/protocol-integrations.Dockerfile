FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY packages/protocol-integrations/package*.json ./packages/protocol-integrations/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY packages/protocol-integrations ./packages/protocol-integrations
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build protocol integrations
WORKDIR /app/packages/protocol-integrations
RUN npm run build

# Expose ports
EXPOSE 3006 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the service
CMD ["npm", "start"]