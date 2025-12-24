# 🛡️ Agent Trust Protocol™ - Quantum-Safe MCP Server
# Production-ready Docker container for enterprise deployment

FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for quantum-safe cryptography
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S atp && \
    adduser -S atp -u 1001

# Copy package files
COPY package*.json ./
COPY lerna.json ./

# Copy workspace packages
COPY packages/ ./packages/

# Install dependencies
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy application code
COPY . .

# Set ownership to non-root user
RUN chown -R atp:atp /app
USER atp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3008}/health || exit 1

# Expose port
EXPOSE 3008

# Environment variables
ENV NODE_ENV=production
ENV PORT=3008
ENV ATP_LOG_LEVEL=info
ENV ATP_QUANTUM_SAFE=true

# Start the quantum-safe server
CMD ["node", "quantum-safe-server-improved.js"]

# Metadata
LABEL maintainer="Larry Lewis <llewis@agenttrustprotocol.com>"
LABEL version="1.0.0"
LABEL description="Agent Trust Protocol™ - World's First Quantum-Safe AI Agent Protocol"
LABEL org.opencontainers.image.title="ATP Quantum-Safe MCP Server"
LABEL org.opencontainers.image.description="Production-ready quantum-safe MCP server for enterprise AI agent security"
LABEL org.opencontainers.image.url="https://atp.dev"
LABEL org.opencontainers.image.source="https://github.com/agent-trust-protocol/atp"
LABEL org.opencontainers.image.vendor="SovrLabs"
LABEL org.opencontainers.image.licenses="Apache-2.0"