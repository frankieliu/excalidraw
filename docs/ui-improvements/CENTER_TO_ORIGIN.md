# Center to Origin Feature

**Date**: 2026-02-11
**Status**: Implemented

## Overview

The "Center to Origin" action allows users to move selected elements (or all elements if none are selected) so that their collective center is positioned at the canvas origin (0,0). This is useful when loading files where elements are positioned elsewhere on the canvas and you want to quickly center them.

## Problem Statement

When loading Excalidraw files, elements may be positioned anywhere on the canvas. This can lead to situations where:
- Elements are not visible when the file is first opened
- The user needs to scroll or zoom out to find their content
- Elements are scattered far from the canvas origin

While Excalidraw provides "Zoom to Fit" functionality (Shift+1) to view all elements, sometimes you want to actually move the elements to a central location rather than just adjusting the view.

## Solution

The "Center to Origin" action:
1. Calculates the bounding box of all target elements
2. Computes the center point of that bounding box
3. Translates all elements so that center point moves to (0,0)
4. Preserves relative positions between elements - they move as a group
5. Also moves bound arrows so they stay connected

## Usage

### Via Command Palette

1. Open the Command Palette with `Ctrl+/` (Windows/Linux) or `Cmd+/` (Mac)
2. Search for "Center to origin"
3. Press Enter to execute

### Behavior

- **With elements selected**: Only the selected elements are moved
- **With no selection**: All elements on the canvas are moved
- **Grouped elements**: Elements maintain their relative positions
- **Bound arrows**: Arrows connected to moving elements also move, including their "dangling" ends

## Implementation Details

### Files Modified

1. **`packages/excalidraw/actions/actionAlign.tsx`**
   - Added `actionCenterToOrigin` action
   - Imports `isArrowElement` for arrow detection
   - Collects bound arrows and moves them with target elements

2. **`packages/excalidraw/actions/index.ts`**
   - Exported `actionCenterToOrigin`

3. **`packages/excalidraw/locales/en.json`**
   - Added label: `"centerToOrigin": "Center to origin"`

4. **`packages/excalidraw/components/CommandPalette/CommandPalette.tsx`**
   - Added action to Command Palette's elementsCommands array

### Action Logic

```typescript
export const actionCenterToOrigin = register({
  name: "centerToOrigin",
  label: "labels.centerToOrigin",
  trackEvent: { category: "element" },
  predicate: (elements, _appState, _appProps, app) => {
    // Available when there are elements in the scene
    return getNonDeletedElements(elements).length > 0;
  },
  perform: (elements, appState, _, app) => {
    // 1. Get target elements (selected or all)
    // 2. Collect bound arrows separately
    // 3. Calculate bounding box center of target elements
    // 4. Translate target elements through group logic
    // 5. Translate bound arrows directly (separate from grouping)
    // 6. Update bound elements
  },
});
```

### Bound Arrow Handling

A key feature is that arrows connected to the moving elements also move:

1. For each target element, we check its `boundElements` array
2. If a bound element is an arrow (type === "arrow"), we collect it separately
3. Target elements are processed through `getSelectedElementsByGroup` for proper group handling
4. Bound arrows are moved directly without grouping logic (they aren't in the selection state)
5. This ensures "dangling" arrows (connected on one end, free on the other) move correctly
6. The behavior matches the standard drag behavior

**Important**: Arrows are handled separately from the main grouping logic because `getSelectedElementsByGroup` relies on `appState.selectedElementIds`, and the arrows we're adding aren't actually selected - they're just bound to selected elements.

## Technical Notes

### Bounding Box Calculation

The center point is calculated using `getCommonBoundingBox()` which returns:
- `minX`, `minY`: Top-left corner
- `maxX`, `maxY`: Bottom-right corner
- `midX`, `midY`: Center point
- `width`, `height`: Dimensions

### Translation

Each element's position is updated by:
```typescript
x: element.x + translateX  // where translateX = -boundingBox.midX
y: element.y + translateY  // where translateY = -boundingBox.midY
```

### Undo/Redo Support

The action uses `CaptureUpdateAction.IMMEDIATELY` to ensure changes are captured in the history stack for undo/redo.

## Related Features

- **Zoom to Fit** (Shift+1): Adjusts view to show all elements without moving them
- **Zoom to Fit Selection** (Shift+2): Adjusts view to show selected elements
- **Align actions**: Align selected elements relative to each other

## Future Enhancements

Potential improvements to consider:

1. **Keyboard shortcut**: Add a dedicated keyboard shortcut
2. **Center to viewport**: Option to center elements to current viewport center instead of origin
3. **Toolbar button**: Add button to toolbar for easier access
4. **Animation**: Animate the centering transition for better visual feedback

## Testing

### Manual Testing Steps

1. Create several elements scattered across the canvas
2. Add some arrows connecting elements (including some with one end unconnected)
3. Run "Center to origin" from Command Palette
4. Verify:
   - All elements moved as a group
   - Center of elements is now at (0,0)
   - Arrows moved correctly with their connected elements
   - Undo/redo works correctly

### Edge Cases

- Empty canvas (action should not appear/be disabled)
- Single element (should center that element)
- Elements already centered (minimal movement)
- Complex grouped elements with nested groups
- Arrows with both ends connected to moving elements
- Arrows with one end connected, one end free ("dangling")

---

**Implementation Complete**: 2026-02-11
