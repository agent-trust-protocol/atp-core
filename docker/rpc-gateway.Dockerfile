FROM node:18-alpine AS base
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/rpc-gateway/package.json ./packages/rpc-gateway/

# Install all dependencies (including dev for building)
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/rpc-gateway ./packages/rpc-gateway
COPY tsconfig.json ./

# Build the application
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/rpc-gateway

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built application
COPY --from=base /app/packages/rpc-gateway/dist ./dist
COPY --from=base /app/packages/rpc-gateway/package.json ./
COPY --from=base /app/node_modules ./node_modules

USER node

EXPOSE 3000 8081

CMD ["node", "dist/index.js"]