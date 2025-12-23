# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies including Python and setuptools
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++

# Copy package files and install dependencies
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/audit-logger/package.json ./packages/audit-logger/
RUN npm install

# Copy source code and build
COPY packages/shared ./packages/shared
COPY packages/audit-logger ./packages/audit-logger
COPY tsconfig.json ./
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/audit-logger

# Install production dependencies only
RUN npm install --omit=dev

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder /app/packages/audit-logger/dist ./dist
COPY --from=builder /app/packages/audit-logger/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy shared package directly to ensure it's available
COPY --from=builder /app/packages/shared/dist ./node_modules/@atp/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@atp/shared/

# Create data directory
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 3005

CMD ["node", "dist/index.js"]