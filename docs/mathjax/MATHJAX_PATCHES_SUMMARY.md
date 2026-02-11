# MathJax Patches and Changes in This Fork

## Overview

This fork includes **MathJax 3.2.2** integration with custom patches to make it work in browser environments. The patches are essential for compatibility since MathJax-full is designed for Node.js server-side rendering.

## Patch File Location

**File**: `patches/mathjax-full+3.2.2.patch`

This patch is automatically applied by `patch-package` during `yarn install`. If there are issues, manually apply with:

```bash
npx patch-package --patch-dir patches
```

## What the Patches Fix

### 1. Browser Global Object Compatibility

**Problem**: MathJax uses `global` which doesn't exist in browsers (browsers use `window`)

**Fix**: Replace `global.MathJax` with `window.MathJax`

```diff
-MathJax = Object.assign(global.MathJax || {}, require("../legacy/MathJax.js").MathJax);
+window.MathJax = Object.assign(window.MathJax || {}, require("../legacy/MathJax.js").MathJax);
```

### 2. Strict Mode Compatibility

**Problem**: Modern bundlers enable strict mode, which forbids `arguments.callee`

**Fix**: Replace `arguments.callee` with named function expressions

```diff
-return function () {return arguments.callee.Init.call(this,arguments)};
+return function fn() {return fn.Init.call(this,Object.assign(arguments,{call:fn}))};
```

Multiple locations patched:

- `CONSTRUCTOR` function
- `Init` method
- `SUPER` method access
- Callback creation
- Various MathML element methods (`toString`, `Append`, etc.)

### 3. Module System Compatibility

**Problem**: CommonJS `require()` doesn't work well with ES modules in browsers

**Fix**: Convert synchronous `require()` to async `import()`

```diff
-require("../legacy/jax/element/mml/jax.js");
-require("../legacy/jax/input/AsciiMath/config.js");
-require("../legacy/jax/input/AsciiMath/jax.js");
+exports.LegacyAsciiMath = void 0;
+(async () => {
+  await import("../legacy/jax/element/mml/jax.js");
+  await import("../legacy/jax/input/AsciiMath/config.js");
+  await import("../legacy/jax/input/AsciiMath/jax.js");
+  // ... rest of code
+})();
```

## Affected Files in MathJax Package

The patch modifies these files in `node_modules/mathjax-full/`:

1. **`js/input/asciimath/mathjax2/input/AsciiMath.js`**

   - Changes `global` to `window`
   - Converts `require()` to async `import()`

2. **`js/input/asciimath/mathjax2/legacy/MathJax.js`**

   - Fixes `arguments.callee` in `CONSTRUCTOR`
   - Fixes `arguments.callee` in `Init` method
   - Fixes `SUPER` method function reference
   - Fixes `CALLBACK` function

3. **`js/input/asciimath/mathjax2/legacy/jax/element/mml/jax.js`**
   - Fixes `arguments.callee` in multiple MathML element methods:
     - `toString()`
     - `Append()` in table and row elements
     - `Init()` in xml element

## Additional Configuration

### Vite Configuration

**File**: `excalidraw-app/vite.config.mts`

Added to replace `global` during bundling:

```typescript
export default defineConfig({
  define: {
    global: "window",
  },
  // ...
});
```

### TypeScript Declarations

**File**: `packages/excalidraw/subtypes/mathjax/mathjax-legacy.d.ts`

Type definitions for legacy MathJax imports:

```typescript
declare module "mathjax-full/js/input/asciimath/mathjax2/input/AsciiMath.js" {
  export const LegacyAsciiMath: any;
}
```

## Installation Process

### Normal Installation

```bash
yarn install --ignore-engines
```

The `postinstall` script in `package.json` automatically runs:

```bash
patch-package
```

### Manual Patch Application

If patches don't apply automatically:

```bash
npx patch-package --patch-dir patches
```

### Verify Patches Applied

Check the console output during install for:

```
patch-package 6.4.7
Applying patches...
mathjax-full@3.2.2 ✔
```

## Why These Patches Are Necessary

### Browser vs Node.js Environment

- **Node.js**: Uses `global`, CommonJS `require()`, relaxed strict mode
- **Browsers**: Use `window`, ES modules, strict mode by default

### MathJax Legacy Code

- MathJax 2.x legacy compatibility layer uses old JavaScript patterns
- `arguments.callee` was commonly used before strict mode
- Original code assumes Node.js server-side rendering environment

### Modern Build Tools

- Vite, Webpack use strict mode by default
- ES modules are the standard
- Tree-shaking and optimization require predictable module behavior

## Testing the Patches

### Verification Steps

1. Install dependencies: `yarn install`
2. Check console for successful patch application
3. Start dev server: `yarn start`
4. Open browser console (F12)
5. Create math element
6. Should NOT see errors:
   - ❌ "global is not defined"
   - ❌ "'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions"
   - ❌ "require is not defined"

### Expected Behavior

- MathJax loads without errors
- Math formulas render correctly
- No console warnings about global/require/callee

## Troubleshooting

### Patches Not Applied

**Symptoms**: Console errors about `global`, `arguments.callee`, or `require`

**Solution**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
yarn install --ignore-engines

# Or manually apply patches
npx patch-package --patch-dir patches
```

### Build Errors After Patch

**Symptoms**: Build fails with module resolution errors

**Solution**:

```bash
# Clear Vite cache
rm -rf node_modules/.vite excalidraw-app/dist

# Restart with force flag
cd excalidraw-app
npx vite --force
```

### Patch Version Mismatch

**Symptoms**: Warning during install about patch version mismatch

**Solution**: The patch is specifically for `mathjax-full@3.2.2`. If upgrading MathJax:

1. Update version in package.json
2. Regenerate patch: `npx patch-package mathjax-full`
3. Test thoroughly

## Maintenance Notes

### When to Regenerate Patches

Regenerate the patch if:

- Upgrading to a different MathJax version
- MathJax fixes these issues upstream
- Additional browser compatibility issues discovered

### How to Regenerate

```bash
# Install the package
yarn add mathjax-full@3.2.2

# Manually edit files in node_modules/mathjax-full/
# Make your changes to fix issues

# Generate new patch
npx patch-package mathjax-full

# Test thoroughly
yarn start
```

### Future Considerations

**Potential upstream fixes**: MathJax team may:

- Add official browser build
- Remove legacy code dependencies
- Support ES modules natively

**Monitor**: Keep an eye on MathJax releases for:

- Browser-compatible distributions
- Removal of `arguments.callee` usage
- Native ES module support

## Related Documentation

- **MATH_SETUP.md** - Complete setup guide for math features
- **MATHJAX_INTEGRATION_STATUS.md** - Current integration status
- **MATH_FONT_SIZE_FIX.md** - Recent fixes for font size and editing

## Patch Integrity

The patch file is versioned in git at:

```
patches/mathjax-full+3.2.2.patch
```

**Do not modify** the patch file directly. Instead:

1. Edit source files in `node_modules/mathjax-full/`
2. Regenerate patch with `npx patch-package mathjax-full`
3. Test changes thoroughly
4. Commit new patch file to git

## Technical Details

### Patch Format

Uses unified diff format compatible with `patch-package`:

- Prefix: `diff --git`
- Shows old and new file paths
- Line-by-line changes with +/- markers
- Context lines for accurate matching

### Application Process

`patch-package` applies patches by:

1. Reading patch file
2. Finding target files in `node_modules/`
3. Applying line-by-line changes
4. Verifying patch success

### Failure Recovery

If patch application fails:

- Check MathJax version matches (`3.2.2`)
- Inspect console output for specific errors
- Manually compare patch with target files
- Regenerate patch if necessary

---

**Last Updated**: 2026-02-07 **MathJax Version**: 3.2.2 **Patch Version**: Initial
