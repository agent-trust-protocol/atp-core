#!/usr/bin/env node

// 🛡️ Agent Trust Protocol™ - Demo Server
// Lightweight server for hosting the interactive demo

import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DemoServer {
    constructor(port = 3009) {
        this.port = port;
        this.demoDir = __dirname;
        this.mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon'
        };
        
        this.setupServer();
    }

    setupServer() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🛡️ ATP Demo Server running at:`);
            console.log(`   Local:    http://localhost:${this.port}`);
            console.log(`   Network:  http://0.0.0.0:${this.port}`);
            console.log(`\n🚀 Open your browser and navigate to the demo!`);
        });

        this.server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${this.port} is already in use`);
                console.log(`💡 Try running with a different port: node server.js --port 3010`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        let pathname = parsedUrl.pathname;

        // Default to index.html for root path
        if (pathname === '/') {
            pathname = '/index.html';
        }

        // Handle API endpoints for demo
        if (pathname.startsWith('/api/')) {
            this.handleAPIRequest(req, res, pathname, parsedUrl.query);
            return;
        }

        // Serve static files
        this.serveStaticFile(req, res, pathname);
    }

    handleAPIRequest(req, res, pathname, query) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Mock API responses for demo
        const mockResponses = {
            '/api/health': {
                status: 'healthy',
                service: 'ATP Demo Server',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                demo_mode: true
            },
            '/api/demo/status': {
                demo_active: true,
                features_enabled: [
                    'quantum_safe_signatures',
                    'trust_level_system',
                    'real_time_monitoring',
                    'api_integration',
                    'performance_benchmarks'
                ],
                uptime: '99.9%',
                last_updated: new Date().toISOString()
            }
        };

        const response = mockResponses[pathname];
        
        if (response) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API endpoint not found', path: pathname }));
        }
    }

    serveStaticFile(req, res, pathname) {
        const filePath = path.join(this.demoDir, pathname);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = this.mimeTypes[ext] || 'application/octet-stream';

        // Security check - prevent directory traversal
        if (!filePath.startsWith(this.demoDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(this.generate404Page(pathname));
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 Internal Server Error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }

    generate404Page(pathname) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | ATP Demo</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
        }
        .error-container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 4rem; margin-bottom: 20px; }
        p { font-size: 1.2rem; margin-bottom: 30px; }
        a {
            color: white;
            text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        a:hover { background: rgba(255,255,255,0.3); }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>🛡️ 404</h1>
        <p>The requested file <code>${pathname}</code> was not found.</p>
        <a href="/">← Back to ATP Demo</a>
    </div>
</body>
</html>`;
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3009;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[i + 1]);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('❌ Invalid port number. Please use a port between 1 and 65535.');
            process.exit(1);
        }
    }
}

// Start the demo server
console.log('🛡️ Starting Agent Trust Protocol™ Demo Server...');
new DemoServer(port);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ATP Demo Server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down ATP Demo Server...');
    process.exit(0);
});