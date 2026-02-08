# Quick Test for Math Only Control

Since you're seeing the multiline math rendering logs but not the Math Only control logs, let's do a simple test:

## Test Steps

1. **Select the math element** with the three lines ($x$, $y$, $z$)
2. **Look at the left panel** (properties panel)
3. **Scroll down** if needed - the Math Only control should be below other properties
4. **Take a screenshot** of what you see in the properties panel

## What to Look For

In the properties panel (left side), you should see:
- Stroke (color)
- Background (color)
- Fill style
- Stroke width
- Stroke style
- Sloppiness
- Edges
- Font size
- **[Somewhere around here]** Math display / Math Only control
- Text align
- etc.

## If You Still Don't See It

Try refreshing the page and check the console immediately when you select a math element. You should see:
```
[MATH DEBUG] changeMathOnly predicate: true selected math elements: 1
```

If you see `predicate: false`, then the element isn't being recognized as a math element.

## Manual Check

In the console, paste this to check if your element is properly recognized:
```javascript
const app = window.EXCALIDRAW_ASSET_PATH ? null : document.querySelector('.excalidraw-wrapper');
console.log('Found app wrapper:', !!app);
```

Let me know what you find!
