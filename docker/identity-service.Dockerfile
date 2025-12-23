# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies including Python and setuptools
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++

# Copy package files and install dependencies
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/identity-service/package.json ./packages/identity-service/
RUN npm install

# Copy source code and build
COPY packages/shared ./packages/shared
COPY packages/identity-service ./packages/identity-service
COPY tsconfig.json ./
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/identity-service

# Install production dependencies only
RUN npm install --omit=dev

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder /app/packages/identity-service/dist ./dist
COPY --from=builder /app/packages/identity-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]