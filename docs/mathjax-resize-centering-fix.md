# MathJax Resize Centering Fix

How MathJax-rendered text centering inside containers was fixed during resize operations.

## Problem

When a container (rectangle, ellipse) with MathJax text is resized by dragging transform handles, the bound text centers based on raw LaTeX string dimensions (`$x$` measured via canvas 2D) instead of rendered SVG dimensions. The text appears misaligned until the user clicks to edit it, which triggers a re-render with correct measurement.

## Root Cause

The resize call chain does not pass MathJax-aware measurement functions:

```
App.tsx maybeHandleResize()
  → transformElements()              # no custom measurement params
    → resizeSingleElement()          # no custom measurement params
      → handleBindTextResize()       # uses DEFAULT canvas measureText()
```

`handleBindTextResize` (in `packages/element/src/textElement.ts:168`) already accepts optional `customMeasureFn` and `customWrapFn` parameters, but they were never passed from the resize path.

In contrast, other code paths (text editing, arrow movement, element duplication) correctly pass measurement options via `getMathMeasurementOptions()`.

## Data Flow — Before Fix

```
Container resize drag
  → handleBindTextResize(container, scene, direction, maintainAspect)
    → measureText(text, font, lineHeight)  // DEFAULT: canvas 2D measurement
    → Computes width/height based on raw "$x$" string
    → Text positioned with wrong dimensions → MISALIGNED

User clicks text to edit
  → redrawTextBoundingBox(..., customMeasureFn, customWrapFn)
    → methods.measureText(element, {text, fontSize})  // MathJax SVG measurement
    → Correct width/height → ALIGNED
```

## Fix

### `packages/element/src/resizeElements.ts`

Added optional `customMeasureFn` and `customWrapFn` parameters to:

1. **`transformElements`** (line 87) — top-level resize entry point
2. **`resizeSingleElement`** (line 722) — single element resize handler

Both pass the functions through to `handleBindTextResize`:

```typescript
handleBindTextResize(
  latestElement,
  scene,
  handleDirection,
  shouldMaintainAspectRatio,
  customMeasureFn,    // NEW
  customWrapFn,       // NEW
);
```

### `packages/excalidraw/components/App.tsx`

In `maybeHandleResize` (line ~12480), extract MathJax measurement options and pass them:

```typescript
const mathMeasurementOptions =
  selectedElements.length === 1
    ? this.getMathMeasurementOptions(selectedElements[0])
    : undefined;

transformElements(
  ...,
  mathMeasurementOptions?.customMeasureFn,
  mathMeasurementOptions?.customWrapFn,
);
```

## `getMathMeasurementOptions` Reference

Located at `App.tsx:672`. Returns `{ customMeasureFn, customWrapFn }` if the element has bound text with a math subtype, or `{}` otherwise.

```typescript
private getMathMeasurementOptions = (element: ExcalidrawElement) => {
  const boundText = hasBoundTextElement(element)
    ? getBoundTextElement(element, this.scene.getNonDeletedElementsMap())
    : null;

  if (boundText?.subtype) {
    const methods = getSubtypeMethods(boundText.subtype);
    if (methods?.measureText && methods?.wrapText) {
      return {
        customMeasureFn: (text, font, lineHeight) =>
          methods.measureText(boundText, { text, fontSize: boundText.fontSize }),
        customWrapFn: (text, font, maxWidth) =>
          methods.wrapText(boundText, maxWidth, { text, fontSize: boundText.fontSize }),
      };
    }
  }
  return {};
};
```

## All Code Paths Using `getMathMeasurementOptions`

| Location | Context |
|----------|---------|
| `App.tsx` `maybeHandleResize` | Container resize (this fix) |
| `App.tsx` keyboard arrow move | Moving elements with arrow keys |
| `App.tsx` text editing `onChange` | Live text editing in WYSIWYG |
| `App.tsx` cropping | Image crop with bound text |
| `App.tsx` drag-duplicate | Alt+drag element duplication |
