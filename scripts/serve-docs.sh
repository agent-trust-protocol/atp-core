#!/bin/bash

# ATP™ Documentation Server
# ========================
# Serves the ATP™ documentation site locally

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}📚 ATP™ Documentation Server${NC}"
echo -e "${CYAN}==============================${NC}"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python is not installed. Please install Python to serve documentation.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docs/index.html" ]; then
    echo -e "${RED}❌ Please run this script from the ATP™ root directory${NC}"
    exit 1
fi

# Get the local IP address for network access
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo -e "${BLUE}🚀 Starting documentation server...${NC}"
echo ""
echo -e "${BOLD}📋 Access URLs:${NC}"
echo -e "• Local: ${GREEN}http://localhost:8000${NC}"
if [ -n "$LOCAL_IP" ]; then
    echo -e "• Network: ${GREEN}http://$LOCAL_IP:8000${NC}"
fi
echo ""
echo -e "${BOLD}📄 Available Documentation:${NC}"
echo -e "• Main Site: ${CYAN}http://localhost:8000${NC}"
echo -e "• Developer Guide: ${CYAN}http://localhost:8000/DEVELOPER_ONBOARDING.md${NC}"
echo -e "• API Reference: ${CYAN}http://localhost:8000/API_REFERENCE.md${NC}"
echo -e "• Architecture: ${CYAN}http://localhost:8000/architecture.md${NC}"
echo -e "• Security Guide: ${CYAN}http://localhost:8000/security.md${NC}"
echo ""
echo -e "${BLUE}💡 Tip: The server will automatically serve markdown files as rendered HTML${NC}"
echo -e "${BLUE}🛑 Press Ctrl+C to stop the server${NC}"
echo ""

# Change to docs directory and start server
cd docs

# Create a simple Python server that can handle markdown
cat > server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes
import markdown
from urllib.parse import unquote

class DocHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Decode URL path
        path = unquote(self.path)
        
        # Remove query parameters
        if '?' in path:
            path = path.split('?')[0]
            
        # Default to index.html
        if path == '/':
            path = '/index.html'
        
        # Handle markdown files
        if path.endswith('.md'):
            md_file = path[1:]  # Remove leading slash
            if os.path.exists(md_file):
                try:
                    with open(md_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Convert markdown to HTML
                    html_content = markdown.markdown(content, extensions=['tables', 'fenced_code', 'toc'])
                    
                    # Wrap in HTML template
                    full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATP™ Documentation - {os.path.basename(md_file)}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        
        h1, h2, h3, h4, h5, h6 {{
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 1em;
        }}
        
        h1 {{
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        
        h2 {{
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
        }}
        
        code {{
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            color: #e74c3c;
        }}
        
        pre {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }}
        
        pre code {{
            background: none;
            padding: 0;
            color: #333;
        }}
        
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        
        th {{
            background: #f2f2f2;
            font-weight: 600;
        }}
        
        blockquote {{
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 10px 20px;
            background: #f8f9fa;
        }}
        
        a {{
            color: #3498db;
            text-decoration: none;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        .nav {{
            background: #2c3e50;
            color: white;
            padding: 15px;
            margin: -20px -20px 30px -20px;
            border-radius: 0;
        }}
        
        .nav a {{
            color: #ecf0f1;
            margin-right: 20px;
            text-decoration: none;
        }}
        
        .nav a:hover {{
            color: #3498db;
        }}
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">🏠 Home</a>
        <a href="/DEVELOPER_ONBOARDING.md">🚀 Developer Guide</a>
        <a href="/API_REFERENCE.md">📡 API Reference</a>
        <a href="/architecture.md">🏗️ Architecture</a>
        <a href="/security.md">🔐 Security</a>
    </div>
    {html_content}
</body>
</html>
                    """
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(full_html.encode('utf-8'))
                    return
                except Exception as e:
                    print(f"Error processing {md_file}: {e}")
        
        # Default handling for other files
        super().do_GET()

# Install markdown if not available
try:
    import markdown
except ImportError:
    print("Installing markdown package...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown"])
    import markdown

PORT = 8000
Handler = DocHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ ATP™ Documentation server running at http://localhost:{PORT}")
    print(f"📚 Serving files from: {os.getcwd()}")
    httpd.serve_forever()
EOF

# Try to install markdown if Python is available
if command -v pip3 &> /dev/null; then
    pip3 install markdown &> /dev/null || true
elif command -v pip &> /dev/null; then
    pip install markdown &> /dev/null || true
fi

# Start the documentation server
$PYTHON_CMD server.py

# Cleanup on exit
trap 'rm -f server.py' EXIT