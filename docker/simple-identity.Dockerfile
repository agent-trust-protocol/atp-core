FROM node:18-alpine

WORKDIR /app

# Copy pre-built application
COPY packages/identity-service/dist ./dist
COPY packages/identity-service/package.json ./

# Copy shared library
COPY packages/shared/dist ./node_modules/@atp/shared/dist
COPY packages/shared/package.json ./node_modules/@atp/shared/

# Install runtime dependencies only (no dev dependencies)
RUN npm install --production --ignore-scripts

# Create data directory
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]