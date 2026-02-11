# Development Setup Guide

## Quick Start

### Option 1: Using the startup script (Recommended)

```bash
./start.sh
```

This script will:

- Check and install dependencies if needed
- Start the Vite development server on http://127.0.0.1:3001

### Option 2: Manual start

```bash
# From the root directory
yarn start

# Or from the excalidraw-app directory
cd excalidraw-app
yarn start
```

## Build and Run

### Build the project

```bash
# Build all packages
yarn build:packages

# Build the app only
yarn build:app

# Build everything
yarn build
```

### Run production build locally

```bash
yarn start:production
```

This will build the app and serve it on http://localhost:5001

## Development Commands

```bash
# Type checking
yarn test:typecheck

# Run tests (with snapshot updates)
yarn test:update

# Run tests in watch mode
yarn test

# Auto-fix formatting and linting
yarn fix

# Run linting only
yarn test:code

# Format check
yarn test:other
```

## Environment Configuration

The development server uses environment variables from `.env.development`:

- **VITE_APP_PORT**: Dev server port (default: 3001)
- **VITE_APP_WS_SERVER_URL**: WebSocket server for collaboration (default: http://localhost:3002)
- **VITE_APP_AI_BACKEND**: AI backend URL (default: http://localhost:3016)

To override these locally, create a `.env.development.local` file (gitignored).

## Troubleshooting

### Port already in use

If port 3001 is already in use, you can:

1. Kill the process using the port:

   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. Or change the port in `.env.development`:
   ```
   VITE_APP_PORT=3002
   ```

### Security Sandbox Issues

If you're using Claude Code CLI and encounter sandbox restrictions:

1. Open the monitoring dashboard: http://localhost:5892
2. Navigate to "Tools" in the sidebar
3. Click "Add Tool"
4. Add the tool name (e.g., "node" or "vite")
5. Select 'Permanent' for persistent access
6. Click "Add Tool"

### Dependencies issues

If you encounter dependency issues:

```bash
# Clean install
yarn clean-install

# Or manually
yarn rm:node_modules
yarn install
```

## Project Structure

```
excalidraw/
├── excalidraw-app/     # Main web application
├── packages/           # Core packages
│   ├── common/         # Shared utilities
│   ├── element/        # Element definitions
│   ├── excalidraw/     # Main React component library
│   ├── math/           # Math utilities
│   └── utils/          # Utility functions
├── examples/           # Integration examples
└── public/             # Static assets
```

## Additional Resources

- **Main Documentation**: Check CLAUDE.md for project structure details
- **Contributing**: See CONTRIBUTING.md for contribution guidelines
- **Math Setup**: See MATH_SETUP.md for LaTeX/MathJax integration details
- **SVG Import**: See SVG_IMPORT_SUMMARY.md for SVG import feature documentation
