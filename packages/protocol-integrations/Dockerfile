FROM node:18-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ curl

# Copy root package files and workspace configuration
COPY ../../package*.json ./
COPY ../../lerna.json ./
COPY ../../tsconfig.json ./

# Copy shared package
COPY ../shared ./packages/shared/

# Copy protocol-integrations package
COPY . ./packages/protocol-integrations/

# Install all dependencies from root
RUN npm install

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build protocol-integrations
WORKDIR /app/packages/protocol-integrations
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3006 3007 3008

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

CMD ["node", "dist/index.js"]