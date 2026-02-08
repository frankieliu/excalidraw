# Setting Up Excalidraw with Math Support

This guide explains how to run the Excalidraw math preview branch locally.

## Prerequisites

- Node.js (v18-20 recommended, but v25 works with `--ignore-engines`)
- yarn package manager
- Git

## Setup from Master Branch

### 1. Clone and Switch to Math Branch

```bash
# If starting fresh, clone the repo
git clone https://github.com/excalidraw/excalidraw.git
cd excalidraw

# Fetch and checkout the math branch
git fetch origin danieljgeiger-mathjax:danieljgeiger-mathjax
git checkout danieljgeiger-mathjax
```

### 2. Install Dependencies

```bash
# Install yarn if you don't have it
npm install -g yarn

# Install project dependencies
# Note: Use --ignore-engines if you have Node v21+
yarn install --ignore-engines
```

### 3. Apply MathJax Patches

The MathJax library needs patches to work in the browser. These are automatically applied during install, but if you have Node version issues, run manually:

```bash
npx patch-package --patch-dir patches
```

**What the patches fix:**
- Replaces `global` with `window` for browser compatibility
- Fixes `arguments.callee` issues in strict mode
- Converts `require()` to async `import()` for ES modules

### 4. Configure Vite for Browser Globals

Add the following to `excalidraw-app/vite.config.mts` in the `defineConfig()` object:

```typescript
export default defineConfig({
  define: {
    global: 'window',
  },
  // ... rest of config
});
```

This tells Vite to replace all `global` references with `window` during bundling.

### 5. Start Development Server

```bash
# From project root
cd excalidraw-app
npx vite

# Or from project root, if yarn works:
# yarn start
```

The app will be available at **http://localhost:3000/**

## Using Math Features

### Enabling Math Mode

1. Create a text element (press `T` or click the Text tool)
2. Look for the **Math** button in the toolbar/properties panel
3. Click it to enable math mode
4. Wait 5-10 seconds for MathJax to load (first time only)

### Math Syntax

**TeX/LaTeX format** (default):
```
$E = mc^2$
$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
$\sum_{i=1}^n x_i = \frac{n(n+1)}{2}$
$\int_0^\pi \sin(x)\,dx = 2$
```

**AsciiMath format** (toggle via action button):
```
`x^2 + y^2 = r^2`
`sqrt(x^2 + y^2)`
`sum_(i=1)^n i = (n(n+1))/2`
```

**Keyboard shortcuts:**
- `Shift+R` - Reset/toggle math mode settings

### Features

- ✅ Real-time LaTeX/AsciiMath rendering
- ✅ Mix math formulas with regular text
- ✅ Math-only mode for entire text blocks
- ✅ SVG export with formulas
- ✅ PNG export with formulas
- ✅ Uses MathJax 3.2.2

## Troubleshooting

### Error: `global is not defined`

**Cause:** Vite isn't replacing `global` with `window`, or patches aren't applied.

**Fix:**
1. Verify `vite.config.mts` has `define: { global: 'window' }`
2. Run `npx patch-package --patch-dir patches`
3. Clear cache: `rm -rf node_modules/.vite excalidraw-app/dist`
4. Restart server with `npx vite --force`
5. Hard refresh browser (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows/Linux)

### Error: `arguments.callee` in strict mode

**Cause:** MathJax patches not applied.

**Fix:**
```bash
npx patch-package --patch-dir patches
rm -rf node_modules/.vite
cd excalidraw-app && npx vite --force
```

### Math not rendering

**Solutions:**
- Wait 10-15 seconds for MathJax to load on first use
- Check browser console for errors
- Try opening in Incognito/Private window
- Verify math delimiters: `$...$` for TeX, `` `...` `` for AsciiMath

### Node version incompatibility

If you see "The engine 'node' is incompatible":

```bash
yarn install --ignore-engines
```

Then apply patches manually:
```bash
npx patch-package --patch-dir patches
```

## Technical Details

### Branch Information

- **Branch:** `danieljgeiger-mathjax`
- **Base:** Excalidraw v0.17.x
- **MathJax Version:** 3.2.2
- **Status:** Preview/Development (not merged to master)

### Architecture

Math support is implemented as a **text element subtype**:
- Location: `packages/excalidraw/element/subtypes/mathjax/`
- Components:
  - `implementation.tsx` - MathJax integration and rendering
  - `types.ts` - Subtype definition
  - `index.ts` - Hook for registering the subtype
- Patches: `patches/mathjax-full+3.2.2.patch`

### Why Patches Are Needed

MathJax-full is designed for Node.js server-side rendering. Browser compatibility requires:

1. **Global object** - Node uses `global`, browsers use `window`
2. **Strict mode** - Modern bundlers enable strict mode, which forbids `arguments.callee`
3. **Module system** - ES modules require async imports, not CommonJS `require()`

The patch rewrites MathJax's legacy code to work in modern browser environments.

## Next Steps

To contribute or test:
1. Test various LaTeX formulas
2. Try mixed text and math
3. Test export functionality (PNG/SVG)
4. Report issues to the Excalidraw team

## Preview Site

The official preview is at: **https://math.preview.excalidraw.com**
