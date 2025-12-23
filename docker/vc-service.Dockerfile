FROM node:18-alpine AS base
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++

# Copy package files
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/vc-service/package.json ./packages/vc-service/

# Install all dependencies (including dev for building)
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/vc-service ./packages/vc-service
COPY tsconfig.json ./

# Build the application
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/vc-service

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built application
COPY --from=base /app/packages/vc-service/dist ./dist
COPY --from=base /app/packages/vc-service/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 3002

CMD ["node", "dist/index.js"]