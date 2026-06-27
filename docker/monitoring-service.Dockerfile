# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# sqlite3 requires native compilation
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++

COPY package.json package-lock.json lerna.json ./
COPY packages/monitoring-service/package.json ./packages/monitoring-service/
RUN npm install

COPY packages/monitoring-service ./packages/monitoring-service
COPY tsconfig.json ./
RUN npm run build --workspace=@atp/monitoring-service

# Install production dependencies only
RUN npm install --omit=dev

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# sqlite3 native module needs these at runtime on Alpine
RUN apk add --no-cache sqlite

COPY --from=builder /app/packages/monitoring-service/dist ./dist
COPY --from=builder /app/packages/monitoring-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 3005

CMD ["node", "dist/index.js"]
