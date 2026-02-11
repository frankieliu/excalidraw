# Development Environment Setup Fixes

This document describes the fixes applied to resolve development server issues and how to reproduce them if needed.

## Issues Encountered

1. **Jotai export error**: `unstable_createStore` not found in Vite cache
2. **Babel plugin missing**: `@babel/plugin-syntax-class-static-block` not found
3. **TypeScript type conflicts**: Duplicate types from source and dist folders causing test errors
4. **Port configuration**: Server defaulting to port 3001 instead of 3000

## Fixes Applied

### 1. Vite Cache Clearing (Temporary Fix - Run as Needed)

When you see module import errors or stale builds:

```bash
cd /Users/frankliu/Projects/excalidraw
rm -rf excalidraw-app/node_modules/.vite
rm -rf node_modules/.vite
```

**Why**: Vite caches pre-bundled dependencies. After dependency changes or rebuilds, the cache can become stale.

### 2. Disable TypeScript Checker in Development (Permanent Fix - Already Applied)

**File**: `excalidraw-app/vite.config.mts`

```typescript
checker({
  typescript: false, // Disabled to avoid type conflicts between source and dist
  eslint:
    envVars.VITE_APP_ENABLE_ESLINT === "false"
      ? undefined
      : { lintCommand: 'eslint "./**/*.{js,ts,tsx}"' },
  overlay: {
    initialIsOpen: envVars.VITE_APP_COLLAPSE_OVERLAY === "false",
    badgeStyle: "margin-bottom: 4rem; margin-left: 1rem",
  },
}),
```

**Why**: The TypeScript checker shows errors when test files reference types from both source (`packages/excalidraw/`) and built (`packages/excalidraw/dist/types/`) folders. These are false positives that don't affect the running application. You can still run `yarn test:typecheck` manually when needed.

### 3. Set Development Port to 3000 (Permanent Fix - Already Applied)

**File**: `.env.development.local` (create if it doesn't exist)

```bash
# Local development overrides
VITE_APP_PORT=3000
```

**Why**: The default `.env.development` file sets `VITE_APP_PORT=3001`. The `.env.development.local` file overrides this for local development. This file is gitignored and won't be committed.

### 4. Clean Dependency Installation (Run When Needed)

If you encounter persistent dependency or build issues:

```bash
cd /Users/frankliu/Projects/excalidraw

# Full clean reinstall
rm -rf node_modules
rm -rf excalidraw-app/node_modules
rm -rf packages/*/node_modules
yarn cache clean
yarn install --ignore-engines

# Clear Vite cache
rm -rf excalidraw-app/node_modules/.vite
rm -rf node_modules/.vite

# Rebuild packages
yarn build:excalidraw
```

**Why**: Sometimes dependencies get corrupted or out of sync. A clean reinstall ensures everything is consistent.

## Quick Start Commands

### Starting the Development Server

```bash
cd /Users/frankliu/Projects/excalidraw
yarn start
```

The server will start on: **http://127.0.0.1:3000/**

### If You See Import Errors

```bash
# Clear Vite cache and restart
rm -rf excalidraw-app/node_modules/.vite node_modules/.vite
yarn start
```

### If You Modified Package Code

```bash
# Rebuild the excalidraw package
yarn build:excalidraw

# Clear cache and restart
rm -rf excalidraw-app/node_modules/.vite
yarn start
```

### If TypeScript Errors Appear in Browser

The TypeScript checker is disabled in development mode. If you see TypeScript errors:

1. Check that `vite.config.mts` has `typescript: false`
2. Clear Vite cache: `rm -rf excalidraw-app/node_modules/.vite`
3. Restart the server

You can still run TypeScript checks manually:

```bash
yarn test:typecheck
```

## Testing Your Features

### SVG Import

- **Keyboard shortcut**: `Ctrl/Cmd + Shift + I`
- **Menu**: File → Import SVG
- **Action file**: `packages/excalidraw/actions/actionImportSVG.tsx`

### Excalidraw File Import

- **Keyboard shortcut**: `Ctrl/Cmd + Shift + X`
- **Menu**: File → Import Excalidraw
- **Action file**: `packages/excalidraw/actions/actionImportExcalidraw.tsx`

## Common Issues and Solutions

### Issue: Server starts on port 3001 instead of 3000

**Solution**: Create or update `.env.development.local`:

```bash
echo "VITE_APP_PORT=3000" > .env.development.local
```

### Issue: Module not found or export errors

**Solution**: Clear Vite cache:

```bash
rm -rf excalidraw-app/node_modules/.vite node_modules/.vite
```

### Issue: TypeScript errors in test files showing in browser

**Solution**: This is expected with the current setup. The error is in test files, not your app. You can:

1. Ignore it (it doesn't affect the app)
2. Or ensure `typescript: false` in `vite.config.mts`

### Issue: Babel plugin missing errors

**Solution**: Ensure `patch-package` is installed globally:

```bash
yarn global add patch-package
yarn install --ignore-engines
```

## File Checklist

Make sure these files have the correct settings:

- ✅ `excalidraw-app/vite.config.mts` - TypeScript checker disabled
- ✅ `.env.development.local` - Port set to 3000 (create if missing)
- ✅ `.gitignore` - Should include `.env.development.local` (already there)

## Reverting Changes

If you need to revert to the original setup:

1. **Re-enable TypeScript checker**:

   ```bash
   cd excalidraw-app
   git checkout vite.config.mts
   ```

2. **Remove port override**:
   ```bash
   rm .env.development.local
   ```
   (Server will start on port 3001 again)

## Notes

- `.env.development.local` is gitignored and won't be committed
- The TypeScript checker can still be run manually with `yarn test:typecheck`
- Vite cache is in `node_modules/.vite` and is automatically gitignored
- The dist folder (`packages/excalidraw/dist/`) is rebuilt when you run `yarn build:excalidraw`

## When to Rebuild Packages

You need to rebuild the excalidraw package when you:

- Modify files in `packages/excalidraw/`
- Add new exports to `packages/excalidraw/index.tsx`
- Change TypeScript types that are used by the app

Run:

```bash
yarn build:excalidraw
```

Then clear Vite cache and restart the server.

---

**Last Updated**: 2026-02-07 **Status**: Development server running on http://127.0.0.1:3000/
