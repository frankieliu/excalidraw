# Port Configuration Guide

**Date**: 2026-02-09

## Overview

This document explains how to configure the development server port in Excalidraw and where the port settings are located.

## Current Configuration

By default, the development server runs on **port 3000** (overridden from the default 3001).

## Port Configuration Files

### Environment Files

Excalidraw uses environment variables to configure the Vite dev server port. The files are located in the project root:

1. **`.env.development`** (line 30) - Base development configuration

   ```bash
   VITE_APP_PORT=3001
   ```

2. **`.env.development.local`** (line 2) - **Local overrides (takes precedence)**

   ```bash
   VITE_APP_PORT=3000
   ```

3. **`.env.production`** - Production configuration (no port specified)

### Order of Precedence

Environment files are loaded in this order (later files override earlier ones):

1. `.env.development` (base)
2. `.env.development.local` (overrides base)

**Note**: `.env.development.local` is typically gitignored and used for personal local settings.

### Vite Configuration

The port setting is read by Vite in `excalidraw-app/vite.config.mts` (lines 19-24):

```typescript
server: {
  host: "127.0.0.1",
  port: Number(envVars.VITE_APP_PORT || 3000),  // Reads from env
  open: true,  // Opens browser automatically
},
```

**Default fallback**: If `VITE_APP_PORT` is not set, Vite defaults to port **3000**.

## Development Commands

All development commands use the same port configuration:

### `yarn dev`

```bash
yarn dev
```

- Script location: `package.json:72`
- Runs: `bash start.sh` → `npx vite` in `excalidraw-app/`
- Mode: `development`
- Port: **3000** (from `.env.development.local`)
- URL: http://localhost:3000

### `yarn start`

```bash
yarn start
```

- Script location: `package.json:73`
- Runs: `yarn --cwd ./excalidraw-app start`
- Mode: `development` (same as `yarn dev`)
- Port: **3000** (from `.env.development.local`)
- URL: http://localhost:3000

### `yarn start:production`

```bash
yarn start:production
```

- Builds the app first, then serves static files
- Mode: `production`
- Uses production server (typically defaults to port 3000 or as configured)

## How to Change the Port

You have several options to change the development server port:

### Option 1: Edit `.env.development.local` (Recommended)

This is the best option for local development as it won't affect other developers:

```bash
# .env.development.local
VITE_APP_PORT=3001  # or any port you want
```

**Pros**:

- Personal local setting
- Not committed to git
- Won't affect other developers

**Cons**:

- Only applies to your machine

### Option 2: Edit `.env.development`

Change the base development configuration:

```bash
# .env.development
VITE_APP_PORT=3001
```

**Pros**:

- Changes default for all developers
- Committed to git

**Cons**:

- Affects everyone on the team
- May conflict with local overrides

### Option 3: Temporary Environment Variable

Set the port for a single run without changing files:

```bash
VITE_APP_PORT=4000 yarn dev
```

**Pros**:

- No file changes
- One-time use

**Cons**:

- Only applies to that single command
- Must be set each time

### Option 4: Create/Edit `.env.local`

For cross-mode overrides:

```bash
# .env.local (applies to both dev and production)
VITE_APP_PORT=3001
```

## Port Conflicts

If you see an error like:

```
Error: Port 3000 is already in use
```

You have several options:

1. **Stop the process using the port**:

   ```bash
   # Find the process
   lsof -ti:3000

   # Kill the process
   kill -9 $(lsof -ti:3000)
   ```

2. **Change to a different port** (using any method above)

3. **Use Vite's automatic port selection**: Vite will automatically try the next available port if the configured port is busy.

## Environment Variables Reference

### Development Environment Variables

Located in `.env.development`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_APP_PORT` | 3001 (overridden to 3000) | Dev server port |
| `VITE_APP_WS_SERVER_URL` | http://localhost:3002 | WebSocket server for collaboration |
| `VITE_APP_PLUS_APP` | http://localhost:3000 | Excalidraw+ app URL |
| `VITE_APP_AI_BACKEND` | http://localhost:3016 | AI backend URL |

### Other Related Ports

When running the full development stack, these ports are used:

| Port | Service                          |
| ---- | -------------------------------- |
| 3000 | Main Excalidraw app (dev server) |
| 3002 | Collaboration WebSocket server   |
| 3016 | AI backend (if running locally)  |

## Verification

To verify which port your dev server is using:

1. **Check the terminal output** when starting the server:

   ```
   VITE v5.0.12  ready in 482 ms

   ➜  Local:   http://127.0.0.1:3000/
   ```

2. **Check your environment variables**:

   ```bash
   # From project root
   cat .env.development.local | grep PORT
   cat .env.development | grep PORT
   ```

3. **Check running processes**:
   ```bash
   # See what's listening on port 3000
   lsof -i:3000
   ```

## Troubleshooting

### Port Not Changing

If your port change isn't taking effect:

1. **Restart the dev server** - Changes require a restart
2. **Check file precedence** - `.env.development.local` overrides `.env.development`
3. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite excalidraw-app/dist
   ```
4. **Verify no environment variable is set in your shell**:
   ```bash
   echo $VITE_APP_PORT
   ```

### Browser Opens Wrong Port

The dev server is configured to auto-open the browser with the correct port. If it's opening the wrong port:

1. Check the `open` setting in `vite.config.mts`
2. Manually navigate to the correct URL shown in the terminal
3. Update any browser bookmarks to use the correct port

## Related Files

| File                             | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `.env.development`               | Base development environment variables   |
| `.env.development.local`         | Local development overrides (gitignored) |
| `.env.production`                | Production environment variables         |
| `excalidraw-app/vite.config.mts` | Vite server configuration                |
| `start.sh`                       | Development server startup script        |
| `excalidraw-app/package.json`    | NPM scripts for dev server               |

## See Also

- [Development Setup](./DEV_SETUP.md) - General development environment setup
- [Environment Fixes](./DEV_ENV_FIXES.md) - Common development issues and solutions
- [Vite Configuration Documentation](https://vitejs.dev/config/server-options.html) - Official Vite docs

---

**Last Updated**: 2026-02-09
