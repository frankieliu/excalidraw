# Text Bounding Box Refresh Feature

**Date**: 2026-02-09

## Overview

This document describes the "Refresh All Text Bounds" feature that allows users to recalculate bounding boxes for all text elements in the canvas. This is particularly useful when text rendering doesn't match the bounding box, causing text to appear clipped.

## Problem Statement

In certain scenarios, especially with MathJax-rendered text, the bounding boxes for text elements may not match the actual rendered text dimensions. This can happen due to:

- Font loading delays
- MathJax rendering asynchronicity
- Browser font rendering differences
- Cached layout information becoming stale
- Text elements imported from older versions

When this occurs, text appears clipped or truncated within its bounding box.

## Solution

The "Refresh Text Bounds" feature provides a manual way to force recalculation of all text bounding boxes in the current scene. This ensures that all text elements have correctly sized bounding boxes that match their rendered content.

## Implementation

### Files Modified

1. **`packages/excalidraw/actions/actionTextAutoResize.ts`**

   - Added `actionRefreshTextBounds` action
   - Imports `redrawTextBoundingBox`, `hasBoundTextElement`, `getBoundTextElement`
   - Iterates through all elements and refreshes text bounding boxes

2. **`packages/excalidraw/actions/index.ts`**

   - Exported `actionRefreshTextBounds` from `actionTextAutoResize`

3. **`packages/excalidraw/locales/en.json`**

   - Added label: `"refreshTextBounds": "Refresh all text bounds"`
   - Added stats section: `"textTools": "Text Tools"`

4. **`packages/excalidraw/components/Stats/index.tsx`**
   - Imported `actionRefreshTextBounds` and `useExcalidrawActionManager`
   - Added "Text Tools" section in General Stats panel
   - Added button to trigger the refresh action

### Action Implementation

```typescript
export const actionRefreshTextBounds = register({
  name: "refreshTextBounds",
  label: "labels.refreshTextBounds",
  icon: null,
  trackEvent: { category: "element" },
  predicate: (_elements, appState, _props, app) => {
    // Only show when there are text elements in the scene
    const elements = app.scene.getNonDeletedElements();
    return elements.some((el) => isTextElement(el) || hasBoundTextElement(el));
  },
  perform: (_elements, appState, _, app) => {
    const scene = app.scene;
    const elements = scene.getNonDeletedElements();
    const elementsMap = scene.getNonDeletedElementsMap();

    // Refresh all text elements and text within containers
    elements.forEach((element) => {
      if (isTextElement(element)) {
        // Standalone text element
        const container = element.containerId
          ? elementsMap.get(element.containerId)
          : null;
        redrawTextBoundingBox(element, container || null, scene);
      } else if (hasBoundTextElement(element)) {
        // Container with text
        const boundText = getBoundTextElement(element, elementsMap);
        if (boundText) {
          redrawTextBoundingBox(boundText, element, scene);
        }
      }
    });

    return {
      appState,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
});
```

### UI Implementation

The button appears in the Stats panel (Properties sidebar) under the "Text Tools" section:

```typescript
{
  actionManager.isActionEnabled(actionRefreshTextBounds) && (
    <>
      <StatsRow heading>{t("stats.textTools")}</StatsRow>
      <StatsRow>
        <button
          className="exc-button exc-button--outlined"
          onClick={() => {
            actionManager.executeAction(actionRefreshTextBounds);
          }}
          style={{
            width: "100%",
            marginTop: "0.25rem",
          }}
        >
          {t("labels.refreshTextBounds")}
        </button>
      </StatsRow>
    </>
  );
}
```

## How It Works

1. **Predicate Check**: The button only appears when there are text elements (standalone or in containers) in the scene
2. **Element Iteration**: When triggered, the action iterates through all non-deleted elements
3. **Text Detection**: For each element:
   - If it's a text element, calls `redrawTextBoundingBox` with its container (if any)
   - If it's a container with bound text, gets the bound text and calls `redrawTextBoundingBox`
4. **Bounding Box Recalculation**: `redrawTextBoundingBox` function:
   - Measures the actual text dimensions using `measureText`
   - Wraps text if needed based on container constraints
   - Updates element width/height to match measured dimensions
   - Expands container if text doesn't fit
5. **Update Capture**: Changes are immediately captured in history (IMMEDIATELY)

## Usage

### Opening the Stats Panel

1. Click the "Properties" button in the toolbar (or press `Ctrl + /` on Windows/Linux, `Option + /` on Mac)
2. The Stats panel appears on the right side

### Refreshing Text Bounds

1. Open the Stats panel
2. Expand the "General" section if collapsed
3. Look for the "Text Tools" section (appears only if there are text elements)
4. Click "Refresh all text bounds" button

### When to Use

Use this feature when:

- Text appears clipped or truncated
- After opening older Excalidraw files
- Math elements (MathJax) don't render with correct bounding boxes
- Font rendering issues cause text overflow
- After changing system fonts or browser zoom

## Technical Details

### What Gets Refreshed

The feature refreshes bounding boxes for:

1. **Standalone text elements**

   - Free-floating text on the canvas
   - Text not bound to any container

2. **Text within containers**

   - Text inside rectangles, ellipses, diamonds, etc.
   - Labels on arrows
   - Any bound text element

3. **Container dimensions**
   - If text no longer fits, the container is automatically expanded
   - Only applies to non-arrow containers

### What Gets Recalculated

For each text element:

- Text width based on font, size, and content
- Text height based on line count and line height
- Text wrapping based on container constraints
- Container dimensions if text exceeds current size

### Performance Considerations

- **Efficient iteration**: Only processes non-deleted elements
- **Conditional rendering**: Button only appears when needed
- **Immediate capture**: Changes are immediately recorded in history for undo/redo
- **Browser text measurement**: Uses browser's native text measurement APIs
- **Batch processing**: All text elements are processed in a single action

### Limitations

1. **Manual trigger only**: Requires user to click the button (not automatic)
2. **All or nothing**: Refreshes all text, not selective
3. **No visual feedback**: No progress indicator for large canvases
4. **Performance**: May be slow on scenes with hundreds of text elements

## Future Enhancements

Potential improvements to consider:

1. **Auto-refresh on load**: Automatically refresh text bounds when opening a file
2. **Selective refresh**: Option to refresh only selected text elements
3. **Progress indicator**: Show progress when processing many elements
4. **Keyboard shortcut**: Add keyboard shortcut for quick access
5. **Toolbar button**: Add button to main toolbar for easier access
6. **Smart detection**: Automatically detect when text bounds are incorrect
7. **Batch refresh on font change**: Auto-refresh when fonts are loaded or changed

## Related Features

This feature works in conjunction with:

- **Text auto-resize** (`actionTextAutoResize`): Enables automatic text resizing
- **Font size controls**: Font size changes automatically refresh individual elements
- **Container text binding**: Handles text bound to shapes correctly
- **MathJax rendering**: Particularly useful for math element rendering

## Testing

### Manual Testing Steps

1. **Create test scenario**:

   ```
   - Create several text elements (standalone and in containers)
   - Add some MathJax equations (if available)
   - Create text-labeled shapes
   ```

2. **Trigger refresh**:

   ```
   - Open Stats panel
   - Click "Refresh all text bounds"
   ```

3. **Verify results**:

   ```
   - Check that text is no longer clipped
   - Verify containers expanded if needed
   - Confirm undo/redo works correctly
   ```

4. **Test edge cases**:
   ```
   - Empty canvas (button should not appear)
   - Only shapes, no text (button should not appear)
   - Mix of text and shapes (button should appear)
   - Very long text in small containers
   ```

### Expected Behavior

- ✅ Button appears only when text elements exist
- ✅ All text bounding boxes are recalculated
- ✅ Containers expand if text doesn't fit
- ✅ Changes are captured in history (can undo)
- ✅ No error messages or warnings
- ✅ Page remains responsive during refresh

## Troubleshooting

### Button doesn't appear

- **Cause**: No text elements in the scene
- **Solution**: Add a text element or open a file with text

### Text still appears clipped after refresh

- **Cause**: Font loading issue or browser rendering bug
- **Solution**: Try reloading the page, then refresh again

### Performance issues

- **Cause**: Too many text elements (hundreds+)
- **Solution**: Break scene into multiple files or use selective editing

### Containers don't expand

- **Cause**: Arrow labels don't expand containers (by design)
- **Solution**: Manual resize or convert arrow to another shape type

## References

- `redrawTextBoundingBox`: packages/element/src/textElement.ts
- `measureText`: packages/element/src/textElement.ts
- `actionTextAutoResize`: packages/excalidraw/actions/actionTextAutoResize.ts
- Stats panel: packages/excalidraw/components/Stats/index.tsx

---

**Status**: ✅ Implemented and ready for use **Version**: Excalidraw Fork (2026-02-09)
