# Quick Start: Math Support Branch

Get the Excalidraw math preview running locally in 3 steps:

## 1. Setup

```bash
# Clone and checkout math branch
git clone https://github.com/excalidraw/excalidraw.git
cd excalidraw
git checkout danieljgeiger-mathjax

# Install dependencies
yarn install --ignore-engines

# Apply MathJax patches
npx patch-package --patch-dir patches
```

## 2. Configure Vite

Add to `excalidraw-app/vite.config.mts`:

```typescript
export default defineConfig({
  define: {
    global: 'window',
  },
  // ... rest of config
```

## 3. Start Server

```bash
cd excalidraw-app
npx vite
```

Open **http://localhost:3000/**

## Using Math

1. Create text element (press `T`)
2. Click **Math** button in toolbar
3. Type: `$x^2 + y^2 = 1$`
4. Wait 5-10 seconds for MathJax to load

### Example Formulas

```
$E = mc^2$
$\frac{a}{b}$
$\sum_{i=1}^n i$
$\int_0^\infty e^{-x} dx$
```

## Troubleshooting

**Error: `global is not defined`**

- Make sure vite.config.mts has the `define: { global: 'window' }` line
- Clear cache: `rm -rf node_modules/.vite`
- Restart: `npx vite --force`
- Hard refresh browser

**Math not rendering**

- Wait 10-15 seconds on first load
- Check browser console for errors
- Try incognito window

---

For detailed documentation, see [MATH_SETUP.md](./MATH_SETUP.md)
