# Creating a Fork and Pushing Changes

Your changes have been committed locally. Here's how to push them to your own fork:

## Current Status

✅ **Committed changes:**

- `excalidraw-app/vite.config.mts` - Added global polyfill
- `MATH_SETUP.md` - Detailed setup documentation
- `QUICKSTART_MATH.md` - Quick start guide

**Commit:** `3233a1b1` - fix: add global polyfill to vite config for MathJax browser compatibility

**Branch:** `danieljgeiger-mathjax`

## Option 1: Using GitHub CLI (Recommended)

```bash
# Navigate to project directory
cd /Users/frankliu/Work/excalidraw

# Create a fork (if you don't have one already)
gh repo fork excalidraw/excalidraw --remote=true --fork-name=excalidraw

# Push your branch to your fork
git push origin danieljgeiger-mathjax

# Or if the above fails, try:
git push <your-fork-remote-name> danieljgeiger-mathjax
```

## Option 2: Manual Fork + Push

### 1. Create Fork on GitHub

Go to https://github.com/excalidraw/excalidraw and click **"Fork"** button

### 2. Add Your Fork as Remote

```bash
cd /Users/frankliu/Work/excalidraw

# Add your fork (replace YOUR_USERNAME)
git remote add fork https://github.com/YOUR_USERNAME/excalidraw.git

# Verify remotes
git remote -v
```

You should see:

```
origin  https://github.com/excalidraw/excalidraw.git (fetch)
origin  https://github.com/excalidraw/excalidraw.git (push)
fork    https://github.com/YOUR_USERNAME/excalidraw.git (fetch)
fork    https://github.com/YOUR_USERNAME/excalidraw.git (push)
```

### 3. Push to Your Fork

```bash
# Push the math branch to your fork
git push fork danieljgeiger-mathjax

# Or push to origin if you forked correctly
git push origin danieljgeiger-mathjax
```

## Option 3: Create New Branch for Your Changes

If you want to keep the original math branch clean:

```bash
# Create a new branch from current state
git checkout -b math-with-vite-fix

# Push the new branch to your fork
git push fork math-with-vite-fix
```

## Verify Your Push

After pushing, visit your fork on GitHub:

- Go to `https://github.com/YOUR_USERNAME/excalidraw`
- Switch to the `danieljgeiger-mathjax` branch
- You should see your commit: "fix: add global polyfill to vite config..."

## Next Steps

### Share Your Work

You can share your fork with others by giving them:

```
https://github.com/YOUR_USERNAME/excalidraw/tree/danieljgeiger-mathjax
```

### Clone and Run Instructions

Others can run your version with:

```bash
git clone https://github.com/YOUR_USERNAME/excalidraw.git
cd excalidraw
git checkout danieljgeiger-mathjax
yarn install --ignore-engines
npx patch-package --patch-dir patches
cd excalidraw-app && npx vite
```

Or just share the **QUICKSTART_MATH.md** file!

### Create a Pull Request (Optional)

If you want to contribute back to the main branch:

```bash
# Using GitHub CLI
gh pr create --base danieljgeiger-mathjax --head YOUR_USERNAME:danieljgeiger-mathjax

# Or manually:
# 1. Go to your fork on GitHub
# 2. Click "Contribute" → "Open pull request"
# 3. Set base: excalidraw/excalidraw danieljgeiger-mathjax
# 4. Set compare: YOUR_USERNAME/excalidraw danieljgeiger-mathjax
```

## Troubleshooting

**Permission denied (publickey)**

- Your SSH keys may not be set up
- Try HTTPS: `git remote set-url fork https://github.com/YOUR_USERNAME/excalidraw.git`

**Already have a fork?**

```bash
# Just add it as remote and push
git remote add fork https://github.com/YOUR_USERNAME/excalidraw.git
git push fork danieljgeiger-mathjax
```

**Wrong remote?**

```bash
# Check current remote
git remote -v

# Update if needed
git remote set-url origin https://github.com/YOUR_USERNAME/excalidraw.git
```
