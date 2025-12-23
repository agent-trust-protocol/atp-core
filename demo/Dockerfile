# 🛡️ Agent Trust Protocol™ - Demo Environment Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add metadata
LABEL maintainer="ATP Team <demo@atp.dev>"
LABEL description="Agent Trust Protocol™ Interactive Demo Environment"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S atp && \
    adduser -S atp -u 1001 -G atp

# Copy demo files
COPY --chown=atp:atp . .

# Set permissions
RUN chmod +x server.js

# Switch to non-root user
USER atp

# Expose demo port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3009, path: '/api/health', timeout: 5000 }; \
    const req = http.request(options, (res) => { \
        if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# Start demo server
CMD ["node", "server.js"]