# Circular Dependency Solution: Subtype Methods in Element Package

## Problem

When implementing custom measurement functions for math text in containers, we encountered a circular dependency issue.

### The Circular Dependency

**Package Structure:**

```
packages/
├── element/              # Core element types and utilities
│   └── src/
│       ├── textElement.ts
│       └── binding.ts
└── excalidraw/          # Main application
    ├── subtypes/
    │   └── index.ts     # Subtype registry with getSubtypeMethods()
    └── components/
        └── App.tsx
```

**The Problem:**

- `textElement.ts` needs to call subtype-specific measurement functions
- Subtype methods are registered in `excalidraw/subtypes/`
- But `packages/element/` is a lower-level package that can't depend on `packages/excalidraw/`

**If we had imported directly:**

```typescript
// In packages/element/src/textElement.ts
import { getSubtypeMethods } from "../../excalidraw/subtypes"; // ❌ CIRCULAR DEPENDENCY!
```

This would create:

```
element → excalidraw → element (circular!)
```

The `packages/element` package provides primitive element operations, while `packages/excalidraw` uses those operations to build the application. Having `element` depend on `excalidraw` would break this layered architecture.

## Solution: Dependency Injection

Instead of having `textElement.ts` directly access the subtype registry, we used **dependency injection** to pass custom functions from the calling code.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ packages/excalidraw/components/App.tsx              │
│ - Knows about subtypes                              │
│ - Creates custom measurement functions              │
│ - Passes functions down the call chain              │
└────────────────┬────────────────────────────────────┘
                 │ Passes customMeasureFn, customWrapFn
                 ↓
┌─────────────────────────────────────────────────────┐
│ packages/element/src/binding.ts                     │
│ - updateBoundElements() accepts optional functions  │
│ - Passes them to handleBindTextResize()             │
└────────────────┬────────────────────────────────────┘
                 │ Forwards customMeasureFn, customWrapFn
                 ↓
┌─────────────────────────────────────────────────────┐
│ packages/element/src/textElement.ts                 │
│ - handleBindTextResize() accepts optional functions │
│ - Uses custom functions if provided                 │
│ - Falls back to standard functions if not           │
└─────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Make Low-Level Functions Accept Optional Parameters

**File:** `packages/element/src/textElement.ts`

```typescript
export const handleBindTextResize = (
  container: NonDeletedExcalidrawElement,
  scene: Scene,
  transformHandleType: MaybeTransformHandleType,
  shouldMaintainAspectRatio = false,
  // Optional custom functions - injected from above
  customMeasureFn?: (
    text: string,
    font: string,
    lineHeight: number,
  ) => { width: number; height: number },
  customWrapFn?: (text: string, font: string, maxWidth: number) => string,
) => {
  // Use custom if provided, fallback to standard
  const wrapTextFn = customWrapFn || wrapText;
  const measureTextFn = customMeasureFn || measureText;

  // Use wrapTextFn and measureTextFn throughout
  // ...
};
```

**Key Points:**

- Functions are **optional parameters** with default behavior
- No imports from higher-level packages needed
- Works for both regular text and subtypes

#### 2. Thread Parameters Through Call Chain

**File:** `packages/element/src/binding.ts`

```typescript
export const updateBoundElements = (
  changedElement: NonDeletedExcalidrawElement,
  scene: Scene,
  options?: {
    simultaneouslyUpdated?: readonly ExcalidrawElement[];
    changedElements?: Map<string, ExcalidrawElement>;
    // Accept custom functions as part of options
    customMeasureFn?: (/*...*/) => { width: number; height: number };
    customWrapFn?: (/*...*/) => string;
  },
) => {
  // ... later in the function:
  handleBindTextResize(
    element,
    scene,
    false,
    false,
    options?.customMeasureFn, // Forward to next layer
    options?.customWrapFn, // Forward to next layer
  );
};
```

#### 3. Inject Functions from Application Layer

**File:** `packages/excalidraw/components/App.tsx`

```typescript
private getMathMeasurementOptions = (element: ExcalidrawElement) => {
  const boundText = hasBoundTextElement(element)
    ? getBoundTextElement(element, this.scene.getNonDeletedElementsMap())
    : null;

  // Check if bound text has a math subtype
  if (boundText?.subtype) {
    const methods = getSubtypeMethods(boundText.subtype);
    if (methods?.measureText && methods?.wrapText) {
      // Create closure-wrapped functions
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
  return {}; // Empty object for regular text
};

// Usage:
updateBoundElements(element, this.scene, this.getMathMeasurementOptions(element));
```

## Benefits of This Approach

### 1. **No Circular Dependencies**

- Lower-level packages remain independent
- Higher-level packages provide behavior via injection
- Clean separation of concerns

### 2. **Backward Compatibility**

- All parameters are optional
- Existing code works without changes
- Regular text continues to work normally

### 3. **Extensibility**

- Easy to add more subtypes in the future
- No changes needed to low-level packages
- New subtypes just provide their own functions

### 4. **Testability**

- Easy to test with mock functions
- No need to set up entire subtype system for tests
- Can test edge cases in isolation

## Alternative Approaches Considered

### ❌ Alternative 1: Import Directly

```typescript
// In textElement.ts
import { getSubtypeMethods } from "../../excalidraw/subtypes";
```

**Problem:** Creates circular dependency, breaks package layering

### ❌ Alternative 2: Move Subtypes to Element Package

```typescript
// Move packages/excalidraw/subtypes/ → packages/element/src/subtypes/
```

**Problem:**

- Element package becomes tightly coupled to specific implementations
- Violates single responsibility principle
- Makes element package harder to reuse

### ❌ Alternative 3: Event System

```typescript
// Emit events and let higher layers handle them
eventBus.emit("measureText", { element, text });
```

**Problem:**

- Adds complexity with async event handling
- Makes control flow harder to follow
- Overkill for this use case

### ✅ Alternative 4: Dependency Injection (Chosen)

```typescript
// Pass functions as parameters
handleBindTextResize(
  element,
  scene,
  false,
  false,
  customMeasureFn,
  customWrapFn,
);
```

**Benefits:**

- Simple and explicit
- No architectural violations
- Easy to understand and maintain

## Pattern Summary

This is a classic example of the **Dependency Inversion Principle**:

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

In our case:

- **Low-level:** `textElement.ts` defines an **abstraction** (function signature for measurement)
- **High-level:** `App.tsx` provides a **concrete implementation** (math measurement functions)
- **No dependency** from low to high, only high-level knows about low-level

This pattern is common in:

- Plugin architectures
- Callback-based APIs
- Strategy pattern implementations
- Inversion of Control (IoC) containers

## Future Considerations

If we add many more subtypes with different measurement needs, we could consider:

1. **Strategy Pattern:** Create a measurement strategy interface
2. **Registry Pattern:** Register measurement functions by subtype name
3. **Service Locator:** Look up measurement services at runtime

But for the current needs, simple dependency injection is the clearest solution.
