#!/usr/bin/env python3
"""
Simple HTTP server to serve the Image Ingestion Analysis app locally.
This avoids CORS issues when loading CSV files.
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Get the current directory
current_dir = Path(__file__).parent.absolute()
os.chdir(current_dir)

# Server configuration
PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

# Create server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🚀 Server started at http://localhost:{PORT}")
    print(f"📁 Serving files from: {current_dir}")
    print(f"🌐 Open your browser and go to: http://localhost:{PORT}")
    print(f"📊 Your app will be available at: http://localhost:{PORT}/index.html")
    print(f"🧪 Test dropdown at: http://localhost:{PORT}/test_dropdown.html")
    print("\n" + "="*60)
    print("Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    try:
        # Open the main app in browser
        webbrowser.open(f'http://localhost:{PORT}/index.html')
        
        # Keep server running
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        httpd.shutdown() 