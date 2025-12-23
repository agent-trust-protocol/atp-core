#!/usr/bin/env node
/**
 * Simple static file server for ATP™ Demo
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DEMO_DIR = __dirname;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(DEMO_DIR, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';
  
  // Check if file exists and is within demo directory
  if (!filePath.startsWith(DEMO_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>ATP™ Demo - 404</title>
    <style>
        body { font-family: 'Inter', sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .error { background: white; padding: 40px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #667eea; margin-bottom: 20px; }
        a { color: #667eea; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error">
        <h1>🛡️ ATP™ Demo</h1>
        <h2>404 - Page Not Found</h2>
        <p><a href="/">← Back to Demo</a></p>
    </div>
</body>
</html>
        `);
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log('🛡️ ATP™ Demo Server Starting...');
  console.log('═══════════════════════════════════');
  console.log(`🌐 Demo URL: http://localhost:${PORT}`);
  console.log(`📁 Serving: ${DEMO_DIR}`);
  console.log(`🚀 Ready for interactive demonstrations!`);
  console.log('');
  console.log('🔐 Features available in this demo:');
  console.log('   • Quantum-safe signature generation');
  console.log('   • Agent trust level evaluation');
  console.log('   • Real-time metrics monitoring');
  console.log('   • API endpoint testing');
  console.log('   • Compliance report generation');
  console.log('   • Performance benchmarking');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
    console.error(`   PORT=3080 node serve.js`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 ATP™ Demo Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 ATP™ Demo Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});