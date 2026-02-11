# Container Text Rendering Fix for Math Subtypes

## Issue

When adding math text to containers (rectangles, ellipses, etc.) or resizing containers with math text, several problems occurred:

### 1. Initial Rendering Error

**Problem:** When text was added to a container in math mode, the application would crash with:

```
ReferenceError: getBoundTextMaxWidth is not defined
```

**Root Cause:** The `getBoundTextMaxWidth` function was used in `App.tsx` but not imported from `@excalidraw/element`.

### 2. Text Not Centered After Editing

**Problem:** After editing math text on a container, the text would remain at its original position even though its dimensions changed due to math rendering.

**Root Cause:** The code was manually updating width/height but not calling `redrawTextBoundingBox`, which is responsible for recentering text on containers.

### 3. Text Clipped During Container Resize

**Problem:** When resizing a container with math text, the text would be clipped or not fully visible because it used standard text measurement instead of math-specific measurement.

**Root Cause:** The `handleBindTextResize` function in `textElement.ts` only used standard `wrapText` and `measureText` functions, which don't account for MathJax SVG rendering dimensions.

## Solution

### Part 1: Fix Missing Import

**File:** `packages/excalidraw/components/App.tsx`

Added the missing import:

```typescript
import {
  // ... other imports
  getBoundTextMaxWidth,
  // ...
} from "@excalidraw/element";
```

### Part 2: Use `redrawTextBoundingBox` for Centering

**File:** `packages/excalidraw/components/App.tsx` (onSubmit handler)

Changed from manually updating dimensions:

```typescript
// Old approach - just updates dimensions
this.scene.replaceAllElements(
  this.scene.getElementsIncludingDeleted().map((el) => {
    if (el.id === element.id && isTextElement(el)) {
      return newElementWith(el, {
        text,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
    return el;
  }),
);
```

To using `redrawTextBoundingBox`:

```typescript
// New approach - updates dimensions AND recenters
redrawTextBoundingBox(
  wrappedElement,
  container,
  this.scene,
  customMeasureFn,
  customWrapFn,
);
```

This ensures text is properly centered on its container after math rendering.

### Part 3: Support Custom Measurement Functions in Resize

**Modified Files:**

- `packages/element/src/textElement.ts` - `handleBindTextResize`
- `packages/element/src/binding.ts` - `updateBoundElements`
- `packages/excalidraw/components/App.tsx` - all calls to `updateBoundElements`

#### Step 3.1: Make `handleBindTextResize` Accept Custom Functions

Added optional parameters to `handleBindTextResize`:

```typescript
export const handleBindTextResize = (
  container: NonDeletedExcalidrawElement,
  scene: Scene,
  transformHandleType: MaybeTransformHandleType,
  shouldMaintainAspectRatio = false,
  customMeasureFn?: (
    text: string,
    font: string,
    lineHeight: number,
  ) => { width: number; height: number },
  customWrapFn?: (text: string, font: string, maxWidth: number) => string,
) => {
  // Use custom functions if provided, fallback to standard functions
  const wrapTextFn = customWrapFn || wrapText;
  const measureTextFn = customMeasureFn || measureText;

  // ... rest of function uses wrapTextFn and measureTextFn
};
```

#### Step 3.2: Thread Custom Functions Through `updateBoundElements`

Updated `updateBoundElements` to accept and forward custom functions:

```typescript
export const updateBoundElements = (
  changedElement: NonDeletedExcalidrawElement,
  scene: Scene,
  options?: {
    simultaneouslyUpdated?: readonly ExcalidrawElement[];
    changedElements?: Map<string, ExcalidrawElement>;
    customMeasureFn?: (/*...*/) => { width: number; height: number };
    customWrapFn?: (/*...*/) => string;
  },
) => {
  // ... in the function:
  handleBindTextResize(
    element,
    scene,
    false,
    false,
    options?.customMeasureFn,
    options?.customWrapFn,
  );
};
```

#### Step 3.3: Create Helper to Provide Math Functions

Added helper method to `App` class:

```typescript
private getMathMeasurementOptions = (element: ExcalidrawElement) => {
  const boundText = hasBoundTextElement(element)
    ? getBoundTextElement(element, this.scene.getNonDeletedElementsMap())
    : null;

  if (boundText?.subtype) {
    const methods = getSubtypeMethods(boundText.subtype);
    if (methods?.measureText && methods?.wrapText) {
      return {
        customMeasureFn: (text: string, font: string, lineHeight: number) => {
          return methods.measureText(boundText, {
            text,
            fontSize: boundText.fontSize,
          });
        },
        customWrapFn: (text: string, font: string, maxWidth: number) => {
          return methods.wrapText(boundText, maxWidth, {
            text,
            fontSize: boundText.fontSize,
          });
        },
      };
    }
  }
  return {};
};
```

#### Step 3.4: Update All Calls to `updateBoundElements`

Updated all calls to pass custom measurement options:

```typescript
// Arrow key movement
updateBoundElements(element, this.scene, {
  simultaneouslyUpdated: selectedElements,
  ...this.getMathMeasurementOptions(element),
});

// Text editing
updateBoundElements(
  element,
  this.scene,
  this.getMathMeasurementOptions(element),
);

// Element duplication
updateBoundElements(
  element,
  this.scene,
  this.getMathMeasurementOptions(element),
);

// Cropping
updateBoundElements(
  croppingElement,
  this.scene,
  this.getMathMeasurementOptions(croppingElement),
);
```

## Result

Now when working with math text on containers:

1. ✅ Text renders without crashes
2. ✅ Text is properly centered after editing
3. ✅ Text remains visible and properly sized when containers are resized
4. ✅ Math dimensions are accurately measured using MathJax SVG rendering
5. ✅ Text wrapping respects math formula boundaries

## Testing

To verify the fix works:

1. **Create container with math text:**

   - Click the Math (M) button
   - Draw a rectangle
   - Double-click to add text
   - Type a math formula like `x^2 + y^2 = z^2`
   - Verify text appears centered and properly rendered

2. **Edit existing math text:**

   - Double-click the container
   - Modify the text
   - Press Escape or click outside
   - Verify text remains centered

3. **Resize container:**
   - Select the container with math text
   - Drag resize handles
   - Verify math text rewraps and remains visible
   - Verify text stays centered in the container
