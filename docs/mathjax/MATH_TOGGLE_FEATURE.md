# Math Toggle Feature

## Overview

The Math (M) button provides a smart toggle feature that allows users to convert text between regular mode and math mode. It works in three distinct modes depending on the current selection state.

## User-Facing Behavior

### Mode 1: Direct Text Selection
When one or more text elements are selected:
- Clicking the M button toggles the selected text between math mode and regular text mode
- All selected text elements are toggled simultaneously
- The M button appears highlighted when any selected text has math mode active

**Example:**
1. Create a text element with content "x^2 + y^2 = z^2"
2. Select the text element
3. Click the M button
4. The text renders as a mathematical formula
5. Click M again to convert back to regular text

### Mode 2: Container Selection (Bound Text)
When one or more containers (rectangles, ellipses, diamonds) with bound text are selected:
- Clicking the M button toggles the bound text between math mode and regular text mode
- Works even though the container itself is selected, not the text
- The M button appears highlighted when the container's bound text has math mode active
- Text is automatically remeasured and recentered on the container

**Example:**
1. Create a rectangle
2. Double-click to add text: "E = mc^2"
3. Click outside to exit text editing
4. Select the rectangle (not the text)
5. Click the M button
6. The text inside the rectangle renders as a mathematical formula
7. The text automatically adjusts size and stays centered
8. Click M again to convert back to regular text

### Mode 3: Creation Mode
When nothing is selected:
- Clicking the M button activates math mode for creating new elements
- Draw rectangles or add text while in this mode to create math-enabled elements
- This is the original behavior before the toggle feature was added

## Visual Feedback

### Button State
The M button shows as selected (highlighted) in these cases:
- Any selected text elements have math mode active
- Any selected containers have bound text with math mode active
- Math creation mode is active (no selection)

### Tooltip
The tooltip dynamically changes based on context:
- **With text/container selection:** "Toggle Math - M"
- **Without selection:** "Math - M"

## Technical Implementation

### Architecture

The toggle functionality is implemented in `packages/excalidraw/components/Subtypes.tsx` in the `SubtypeButton` function.

#### Key Components

**1. Selection Detection**
```typescript
// Direct text selection
const selectedTextElements = elements.filter(
  (el) => appState.selectedElementIds[el.id] && isTextElement(el),
);

// Container selection with bound text
const selectedContainersWithText = elements.filter(
  (el) =>
    appState.selectedElementIds[el.id] &&
    isBindableElement(el) &&
    hasBoundTextElement(el),
);

// Extract bound text from containers
const boundTextElementsFromContainers = [];
for (const container of selectedContainersWithText) {
  const boundText = getBoundTextElement(container, elementsMap);
  if (boundText) {
    boundTextElementsFromContainers.push(boundText);
  }
}

// Combine all text to toggle
const allTextToToggle = [
  ...selectedTextElements,
  ...boundTextElementsFromContainers,
];
```

**2. Toggle Logic**
```typescript
if (allTextToToggle.length > 0) {
  const textIdsToToggle = new Set(allTextToToggle.map((el) => el.id));

  const updatedElements = elements.map((el) => {
    if (!textIdsToToggle.has(el.id) || !isTextElement(el)) {
      return el;
    }

    const hasSubtype = el.subtype === subtype;

    if (hasSubtype) {
      // Remove subtype - convert to regular text
      const newElement = newElementWith(el, {
        subtype: undefined,
        customData: undefined,
      });

      // Remeasure with standard text measurement
      const container = getContainerElement(newElement, elementsMap);
      redrawTextBoundingBox(newElement, container, app.scene);

      return newElement;
    } else {
      // Add subtype - convert to math text
      const newElement = newElementWith(el, {
        subtype,
        customData: appState.customData?.[subtype] || {},
      });

      // Remeasure with math-specific measurement
      const container = getContainerElement(newElement, elementsMap);
      if (subtypeMethods?.measureText && subtypeMethods?.wrapText) {
        redrawTextBoundingBox(
          newElement,
          container,
          app.scene,
          customMeasureFn,
          customWrapFn
        );
      }

      return newElement;
    }
  });

  return { elements: updatedElements, appState, captureUpdate: "IMMEDIATELY" };
}
```

**3. Visual Feedback**
```typescript
// Check if any selected text has math mode
const hasSelectedMathText = selectedTextElements.some(
  (el) => el.subtype === subtype
);

// Check if any selected containers have bound text with math mode
const elementsMap = new Map(elements.map((el) => [el.id, el]));
const selectedContainersWithMathText = elements.some((el) => {
  if (
    appState.selectedElementIds[el.id] &&
    isBindableElement(el) &&
    hasBoundTextElement(el)
  ) {
    const boundText = getBoundTextElement(el, elementsMap);
    return boundText?.subtype === subtype;
  }
  return false;
});

// Button should be selected if any condition is true
const isSelected = hasSelectedMathText ||
  selectedContainersWithMathText ||
  appState.activeSubtypes?.includes(subtype);
```

### Text Remeasurement

When toggling between modes, text must be remeasured because:
- Math text uses MathJax SVG rendering with different dimensions than standard text
- Text must be recentered on its container (if bound to one)
- Text must be rewrapped to fit container width

The implementation uses `redrawTextBoundingBox` with custom measurement functions:
- **Converting to math:** Uses `subtypeMethods.measureText` and `subtypeMethods.wrapText`
- **Converting to regular:** Uses standard `measureText` and `wrapText`

See [CONTAINER_TEXT_RENDERING_FIX.md](./CONTAINER_TEXT_RENDERING_FIX.md) for details on the measurement system.

## Edge Cases Handled

### Multiple Selection
- Multiple text elements can be toggled simultaneously
- Multiple containers with text can be toggled simultaneously
- Mixed selection (both text elements and containers) works correctly

### Containers Without Text
- Selecting a container without text does nothing when clicking M
- The button doesn't show as selected for empty containers

### Text Already in Desired Mode
- Toggling is idempotent - clicking M on math text converts it to regular
- Clicking M on regular text converts it to math
- Each click reverses the previous state

### Performance
- Uses a Set for O(1) lookup of text IDs to toggle
- Only processes elements that need to be changed
- Single scene update for all changes (not per-element)

## Testing

To verify the feature works correctly:

1. **Direct text toggle:**
   - Create a text element → Select it → Click M
   - Verify text converts to math mode
   - Click M again → Verify text converts back

2. **Container text toggle:**
   - Create a rectangle → Add text to it
   - Select the rectangle (not the text) → Click M
   - Verify text converts to math mode and stays centered
   - Click M again → Verify text converts back

3. **Multiple selection:**
   - Create multiple text elements
   - Select all → Click M
   - Verify all convert to math mode
   - Click M again → Verify all convert back

4. **Mixed selection:**
   - Create a text element and a rectangle with text
   - Select both → Click M
   - Verify both texts convert to math mode
   - Verify the M button shows as selected

5. **Visual feedback:**
   - Select text in math mode → Verify M button is highlighted
   - Select container with math text → Verify M button is highlighted
   - Select text in regular mode → Verify M button is not highlighted

## Related Documentation

- [CONTAINER_TEXT_RENDERING_FIX.md](./CONTAINER_TEXT_RENDERING_FIX.md) - How text rendering and centering works
- [CIRCULAR_DEPENDENCY_SOLUTION.md](./CIRCULAR_DEPENDENCY_SOLUTION.md) - Dependency injection pattern used for custom measurement
