# Math Element Font Size and Editing Fixes

## Date: 2026-02-07

## Issues Fixed

### 1. Font Size Changes Not Working for Math Elements

**Problem**: When changing font size via sidebar buttons, math elements would become invisible or not render at the new size.

**Root Causes**:

- `redrawTextBoundingBox()` was mutating elements in the scene, but during `changeFontSize()` the scene still contained old elements
- The mutation couldn't update the new element being built in `changeProperty()`
- Math image generation is asynchronous, so images would load after render cycle completed without triggering a re-render

**Solution**:

- Modified `redrawTextBoundingBox()` to **return** calculated dimensions instead of only mutating
- Updated `changeFontSize()` to apply returned dimensions to `newElement` using `newElementWith()`
- Modified `offsetElementAfterFontResize()` to return new element instead of mutating scene
- Added `onAsyncRender` callback to `StaticCanvasRenderConfig` type
- Math render now calls `onAsyncRender()` after async image loads to trigger re-render
- App.tsx passes `() => this.scene.triggerUpdate()` as the callback

### 2. Poor Editing Experience in Math Mode

**Problem**: When creating/editing math text:

- Cursor was invisible
- Text was hard to see
- Live math rendering made typing difficult

**Root Cause**:

- During editing, the wysiwyg editor was using math subtype's `measureText`/`wrapText` in real-time
- This caused live math rendering during typing

**Solution**:

- Modified `refreshTextDimensionsWithSubtype()` to **always use normal text measurements** during editing
- Added logic in `onSubmit` handler to **apply math measurements only after editing completes**
- Now editing shows normal cursor and plain text
- Math rendering happens only on Esc/click-outside

## Files Changed

### Core Element Package (Lower-Level)

**`packages/element/src/textElement.ts`**

- Modified `redrawTextBoundingBox()` signature to return dimensions object:
  ```typescript
  ): {
    width: number;
    height: number;
    text: string;
    x: number;
    y: number;
    angle: number;
  }
  ```
- Still mutates scene for backward compatibility with other callers
- Returns calculated dimensions so caller can apply them

**`packages/element/src/renderElement.ts`**

- Updated subtype render call to pass full `renderConfig` as 4th parameter:
  ```typescript
  methods.render(element, renderConfig.elementsMap, context, renderConfig);
  ```
- Allows subtype render methods to access callbacks like `onAsyncRender`

### Excalidraw Package (Higher-Level)

**`packages/excalidraw/scene/types.ts`**

- Added `onAsyncRender?: () => void` to `StaticCanvasRenderConfig` type
- Callback to trigger re-render after async operations complete

**`packages/excalidraw/actions/actionProperties.tsx`** Changes in `changeFontSize()`:

```typescript
// Capture return value from redrawTextBoundingBox
const textUpdates = redrawTextBoundingBox(
  newElement,
  app.scene.getContainerElement(oldElement),
  app.scene,
  customMeasureFn,
  customWrapFn,
);

// Apply the updates to newElement
newElement = newElementWith(newElement, textUpdates);
```

Changes in `offsetElementAfterFontResize()`:

```typescript
// Return new element instead of mutating scene
return newElementWith(nextElement, offsetUpdates);
```

**`packages/excalidraw/components/App.tsx`**

1. Added `onAsyncRender` callback to renderConfig:

```typescript
renderConfig={{
  // ... other config
  getSubtypeMethods,
  onAsyncRender: () => this.scene.triggerUpdate(),
}}
```

2. Simplified `refreshTextDimensionsWithSubtype()`:

```typescript
// During editing, always use normal text measurements
// Subtype rendering will be applied after editing completes
return refreshTextDimensions(
  _element,
  container,
  elementsMap,
  nextOriginalText,
);
```

3. Added math dimension updates in `onSubmit`:

```typescript
// After editing completes, apply subtype measurements
if (!isDeleted && element.subtype) {
  const methods = getSubtypeMethods(element.subtype);
  if (methods?.measureText && methods?.wrapText) {
    // Measure with math rendering
    const dimensions = methods.measureText(updatedElement, {
      fontSize: updatedElement.fontSize,
      text,
    });

    // Update element with correct dimensions
    this.scene.replaceAllElements(/* ... */);
  }
}

// Trigger scene update for math rendering
this.scene.triggerUpdate();
```

**`packages/excalidraw/subtypes/mathjax/implementation.tsx`**

1. Modified `renderMathElement()` signature:

```typescript
const renderMathElement = function (
  element,
  elementMap,
  context,
  renderConfig,
) {
  const onAsyncRender = renderConfig?.onAsyncRender;
  // ...
};
```

2. Added callback after async image load:

```typescript
img.onload = function () {
  // ... draw image ...

  // Trigger re-render after async image load
  if (onAsyncRender) {
    onAsyncRender();
  }
};
```

## Architecture Patterns

### Dependency Injection Pattern

- Lower-level packages (element) can't import from higher-level (excalidraw)
- Solution: Pass functions through parameters or config objects
- `renderConfig` now carries both `getSubtypeMethods` and `onAsyncRender`

### Async Rendering Callback Pattern

- Math images generate asynchronously: SVG → Blob → Image → load event
- Without callback, image would draw once but disappear on next render cycle
- `onAsyncRender` ensures scene re-renders after async operations complete
- This pattern is reusable for other async rendering operations

### Editing vs Rendering Separation

- **During editing**: Use normal text measurements for good UX
- **After editing**: Apply subtype measurements and rendering
- Clear separation of concerns improves user experience
- This pattern is applicable to other subtypes in the future

## Testing Workflow

### Font Size Changes

1. Create math element with text like `x = $x$`
2. Change font size using sidebar buttons (Small/Medium/Large/Very Large)
3. Math should render at new size immediately
4. Console should show: "Generating new image" → "Image loaded, calling onAsyncRender"

### Editing Experience

1. Click Math button to enter math mode
2. Click on canvas to create new text element
3. Should see **normal cursor** and **clearly visible text**
4. Type `x = $x$`
5. Press Esc or click outside
6. Math should **render** with **properly sized bounding box**

### Editing Existing Math

1. Double-click existing math element
2. Should see normal cursor with plain text (not rendered math)
3. Edit the text
4. Press Esc or click outside
5. Math should re-render with updated dimensions

## Debug Logs Removed

Debug console.log statements have been removed from:

- `actionProperties.tsx`: changeFontSize, customMeasureFn, customWrapFn, offsetElementAfterFontResize
- `textElement.ts`: redrawTextBoundingBox
- `implementation.tsx`: renderMathElement, measureMathElement, doRenderChild

Cleanup completed in commit: chore: Remove debug console.log statements

## Backward Compatibility

All changes are backward compatible:

- `redrawTextBoundingBox()` still mutates scene as before
- Added return value doesn't break existing callers that ignore it
- `onAsyncRender` callback is optional in renderConfig
- Subtype render methods work with or without 4th parameter

## Related Issues

This work builds on previous session:

- Math elements now render correctly after font size changes
- Math elements have proper editing experience
- Async rendering doesn't cause elements to disappear

## Future Improvements

1. Consider applying this async callback pattern to other async operations
2. Could extend editing/rendering separation to other complex subtypes
3. May want to cache math images more aggressively to reduce re-generation
