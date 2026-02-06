#!/bin/bash
# Start Excalidraw development server
# This script handles all setup and starts the dev server

set -e  # Exit on error

echo "🚀 Starting Excalidraw..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if node_modules exists, install if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  yarn install --ignore-engines
  echo ""
fi

# Apply MathJax patches (required for math branch)
echo "🔧 Applying MathJax patches..."
npx patch-package --patch-dir patches > /dev/null 2>&1 || true
echo ""

# Clear Vite cache for fresh start
if [ -d "node_modules/.vite" ]; then
  echo "🧹 Clearing Vite cache..."
  rm -rf node_modules/.vite excalidraw-app/dist
  echo ""
fi

# Start the dev server
echo "✨ Starting dev server..."
echo "   Open http://localhost:3000/ in your browser"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

cd excalidraw-app
npx vite
