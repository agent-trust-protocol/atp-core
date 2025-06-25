FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/audit-logger/package*.json ./packages/audit-logger/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/audit-logger ./packages/audit-logger
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build audit logger
WORKDIR /app/packages/audit-logger
RUN npm run build

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the service
CMD ["npm", "start"]