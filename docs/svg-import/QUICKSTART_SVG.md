# Quick Start - Excalidraw with SVG Import

## Single Command to Start

```bash
yarn dev
```

Or directly:
```bash
./start.sh
```

This will:
1. Install dependencies (if needed)
2. Apply MathJax patches
3. Clear Vite cache
4. Start dev server at http://localhost:3000/

## Using SVG Import

### Via Menu
1. Click hamburger menu (☰) → "Import SVG..."
2. Select .svg file
3. Done!

### Via Keyboard
Press **Ctrl/Cmd+Shift+I**

## Files Changed

See `SVG_IMPORT_FEATURE.md` for complete documentation.

## Key Files
- **Action**: `packages/excalidraw/actions/actionImportSVG.tsx`
- **Menu**: `excalidraw-app/components/AppMainMenu.tsx`
- **Localization**: `packages/excalidraw/locales/en.json`
- **Shortcuts**: `packages/excalidraw/actions/shortcuts.ts`

## Troubleshooting

**MathJax error after yarn install?**
```bash
npx patch-package --patch-dir patches
```

**Need hard refresh?**
- Mac: Cmd+Shift+R
- Windows/Linux: Ctrl+Shift+R
