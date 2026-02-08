# How `customData` is Used for Math Subtype

## Overview

`customData` is a flexible property on Excalidraw elements that allows subtypes to store custom properties without modifying the core element structure. For the math subtype, it stores rendering preferences.

## Type Definition

### Base Element Type
From `packages/element/src/types.ts:82`:
```typescript
type _ExcalidrawElementBase = {
  // ... other properties
  subtype?: string;
  customData?: Record<string, any>;  // ← Generic key-value storage
}
```

### Math-Specific Type
From `packages/excalidraw/subtypes/mathjax/implementation.tsx:49`:
```typescript
type MathProps = Record<"useTex" | "mathOnly", boolean>;

type ExcalidrawMathElement = ExcalidrawTextElement & Readonly<{
  subtype: typeof mathSubtype;  // "math"
}>;
```

## What's Stored in `customData` for Math Elements

For math text elements (`subtype: "math"`), `customData` contains:

```typescript
{
  useTex: boolean,     // true = TeX notation ($...$), false = AsciiMath (`...`)
  mathOnly: boolean,   // true = entire text is math, false = mixed text/math
  ariaLabel?: string   // Generated accessibility label (set during render)
}
```

### Property Details

**`useTex`**: Controls which math notation format to use
- `true`: TeX/LaTeX notation with `$...$` or `\(...\)` delimiters
  - Example: `$E = mc^2$`, `$\frac{a}{b}$`
- `false`: AsciiMath notation with `` `...` `` delimiters
  - Example: `` `E = mc^2` ``, `` `a/b` ``

**`mathOnly`**: Controls whether the entire text is treated as math
- `true`: No delimiters needed, entire text is rendered as math
  - Example: Just type `E = mc^2` directly
  - Useful for elements that are purely mathematical
- `false`: Mixed mode - delimiters required to distinguish math from text
  - Example: `The equation $E = mc^2$ is famous`
  - Allows mixing regular text with math expressions

**`ariaLabel`**: Accessibility label (generated, not user-set)
- Automatically generated during rendering
- Contains the math formula in readable text format
- Used by screen readers

## How `customData` is Initialized

### 1. Default Values (GetMathProps class)
From `implementation.tsx:66-101`:

```typescript
class GetMathProps {
  private useTex: boolean = true;      // Default to TeX
  private mathOnly: boolean = false;   // Default to mixed mode

  ensureMathProps = (props: ExcalidrawElement["customData"]): MathProps => {
    return {
      useTex: props?.useTex !== undefined ? props.useTex : this.useTex,
      mathOnly: props?.mathOnly !== undefined ? props.mathOnly : this.mathOnly,
    };
  };
}
```

The singleton instance `getMathProps` provides these defaults if `customData` is missing.

### 2. Element Creation
When converting a text element to math or creating a new math element:

```typescript
// From implementation.tsx:1489-1496
const newElement: ExcalidrawTextElement = newElementWith(oldElement, {
  customData: getMathProps.ensureMathProps({
    useTex: true,  // or get from existing element
    mathOnly: oldElement.customData?.mathOnly || false,
  }),
});
```

### 3. Ensuring Valid Data (ensureMathElement)
From `implementation.tsx:891-902`:

Every time a math element is used, this function ensures `customData` is properly set:

```typescript
const ensureMathElement = (element: Partial<ExcalidrawElement>) => {
  if (!isMathElement(element)) {
    return;
  }
  const mathProps = getMathProps.ensureMathProps(element.customData);
  element.customData = {
    ...element.customData,
    useTex: mathProps.useTex,
    mathOnly: mathProps.mathOnly,
  };
};
```

## How `customData` is Used

### 1. During Rendering
From `implementation.tsx:967`:

```typescript
const renderMathElement = function (element, elementMap, context, renderConfig) {
  ensureMathElement(element);
  const _element = element as NonDeleted<ExcalidrawMathElement>;
  const mathProps = getMathProps.ensureMathProps(_element.customData);
  // Use mathProps.useTex and mathProps.mathOnly to control rendering...
}
```

### 2. During Text Measurement
From `implementation.tsx:944`:

```typescript
const measureMathElement = function (element, next, elementsMap) {
  const customData = next?.customData ?? element.customData;
  const mathProps = getMathProps.ensureMathProps(customData);
  // Use mathProps to calculate text dimensions...
}
```

### 3. Processing Math Notation
From `implementation.tsx:374-386`:

```typescript
const consumeMathNewlines = (text: string, mathProps: MathProps, isMathJaxLoaded: boolean) => {
  const tempText = splitMath(text, mathProps);
  // Process differently based on mathProps.useTex and mathProps.mathOnly
  if (mathProps.useTex || !mathProps.mathOnly) {
    for (let i = 0; i < tempText.length; i++) {
      if (i % 2 === 1) {
        tempText[i] = tempText[i].replace(/\n/g, " ");
      }
    }
  }
  return joinMath(tempText, mathProps, isMathJaxLoaded);
};
```

### 4. Delimiter Selection
From `implementation.tsx:240-258`:

```typescript
const getStartDelimiter = (useTex: boolean, desktopStyle = false) => {
  if (useTex) {
    return desktopStyle ? "\\(" : "$";  // TeX delimiters
  }
  return "`";  // AsciiMath delimiter
};
```

## Two Levels of `customData`

### Element-Level `customData`
Stored on each individual math text element:
```typescript
{
  type: "text",
  subtype: "math",
  customData: {
    useTex: true,
    mathOnly: false
  }
}
```

### AppState-Level `customData`
Stored in the application state as defaults for NEW elements:

From `implementation.tsx:71`:
```typescript
const mathProps = appState?.customData && appState.customData[`math`];
```

When you toggle "Use TeX" in the UI, it updates `appState.customData` which affects new math elements:

```typescript
// From implementation.tsx:1444-1449
const actionUseTexTrue: Action = {
  perform: (elements, appState) => {
    const mathOnly = getMathProps.getMathOnly(appState);
    const customData = appState.customData ?? {};
    customData[`math`] = { useTex: true, mathOnly };
    return { elements, appState: { ...appState, customData } };
  }
};
```

## User Actions That Modify `customData`

### 1. Toggle TeX/AsciiMath (actions: `useTexTrue`, `useTexFalse`)
- Updates both AppState and selected elements
- Changes delimiter style for math notation
- Triggers element re-measurement and re-rendering

### 2. Toggle Math-Only Mode (action: `changeMathOnly`)
- Switches between "entire text is math" and "mixed text/math" modes
- Updates element dimensions (math-only uses different wrapping)
- Triggers element re-measurement

### 3. Reset to Default (action: `resetUseTex`)
- Keyboard shortcut: Shift+R
- Resets selected elements to current AppState defaults

## Backward Compatibility

From the perspective of vanilla Excalidraw (without math subtype):

1. **Unknown `subtype`**: Ignored, element rendered as regular text
2. **Unknown `customData`**: Preserved but not used
3. **Round-trip safety**: Math elements saved → opened in vanilla → saved again → opened in math-enabled version = all data preserved

This is because Excalidraw's restore logic preserves unknown properties:

```typescript
// From packages/excalidraw/data/restore.ts
// Unknown properties on elements are kept during restoration
```

## Summary

`customData` provides a **forward-compatible, backward-compatible** way for the math subtype to store rendering preferences without modifying core Excalidraw types. It enables:

1. **Flexibility**: Each element can have different math notation preferences
2. **User Control**: Toggle between TeX and AsciiMath per element
3. **Compatibility**: Works seamlessly with vanilla Excalidraw (data preserved)
4. **Extensibility**: Other subtypes can use `customData` for their own properties

The pattern is:
- **Element.customData**: Per-element settings
- **AppState.customData**: Default settings for new elements
- **getMathProps.ensureMathProps()**: Ensures valid data with fallback defaults
