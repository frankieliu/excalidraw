# MathJax Integration Status

**Last Updated**: 2026-02-07 **Branch**: mathjax-svg-import-rebased **Status**: 80% Complete (WIP)

## Overview

The MathJax subtype system has been integrated from the `danieljgeiger-mathjax-maint-stage` branch into the current `mathjax-svg-import-rebased` branch. The core infrastructure is complete, but there are remaining TypeScript type compatibility issues preventing the build from completing.

## What's Working ✅

### 1. Dependencies Installed

- ✅ `mathjax-full@3.2.2` - MathJax library for math rendering
- ✅ `patch-package@8.0.0` - For applying browser compatibility patches
- ✅ MathJax patch successfully applied during install

### 2. Core Infrastructure

- ✅ **Subtype System** (`packages/excalidraw/subtypes/index.ts`) - 541 lines

  - Generic plugin architecture for element subtypes
  - Action registration and management
  - Subtype lifecycle hooks
  - React hooks for integration

- ✅ **MathJax Implementation** (`packages/excalidraw/subtypes/mathjax/implementation.tsx`) - 1,673 lines
  - Math rendering with SVG output
  - TeX and AsciiMath input support
  - WYSIWYG editor integration
  - Math SVG caching
  - Text measurement with math overhead

### 3. Type System Updates

- ✅ **Element Types** - Added `subtype?: string` field to base element type
- ✅ **App State** - Added `activeSubtypes` and `customData` fields
- ✅ **API** - Added `addSubtype` method to ExcalidrawImperativeAPI
- ✅ **Element Creation** - Updated `newElement` to support subtypes

### 4. App Integration

- ✅ **App.tsx** - Implemented `addSubtype` method
- ✅ **Action Manager** - Registered subtype action predicate
- ✅ **Export** - `useMathSubtype` hook available for use

### 5. Import Paths

- ✅ All import paths resolved correctly for new file locations
- ✅ Proper use of `@excalidraw/element` and `@excalidraw/common` packages

## What Needs Fixing ⚠️

### TypeScript Type Errors (17 remaining)

#### 1. **Scene API Changes**

```typescript
// Error: Property 'getScene' does not exist on type 'typeof Scene'
Scene.getScene(elements);
```

**Fix**: The Scene API has changed. Need to update to current API.

#### 2. **Action Function Signatures**

```typescript
// Error: ActionFn type mismatch
predicate: (...rest) => rest[4] === undefined;
```

**Fix**: Action predicate functions now take 4 parameters, not 5. Update all action predicates.

#### 3. **Line Height Type Branding**

```typescript
// Error: number not assignable to unitlessLineHeight branded type
getLineHeightInPx(fontFamily, fontSize, lineHeight);
```

**Fix**: Wrap line height values in proper type constructors.

#### 4. **Missing Translation Keys**

```typescript
// Error: "labels.changeMathOnly" not in translation type
t("labels.changeMathOnly");
```

**Fix**: Add MathJax translation keys to `packages/excalidraw/locales/en.json`:

```json
{
  "labels": {
    "changeMathOnly": "Math display",
    "mathOnlyTrue": "Math only",
    "mathOnlyFalse": "Mixed text",
    "resetUseTex": "Reset math input type",
    "useTexTrueActive": "✔ Standard input",
    "useTexTrueInactive": "Standard input",
    "useTexFalseActive": "✔ Simplified input",
    "useTexFalseInactive": "Simplified input"
  },
  "toolBar": {
    "math": "Math"
  }
}
```

#### 5. **ButtonIconSelect Component**

```typescript
// Error: Could not resolve "../../components/ButtonIconSelect"
import { ButtonIconSelect } from "../../components/ButtonIconSelect";
```

**Status**: Temporarily commented out. This component doesn't exist in the current branch.

**Options**:

- Use `ButtonIconCycle` component instead
- Create a simple replacement component
- Leave as plain text for now

## How to Complete the Integration

### Option 1: Fix Type Errors (Recommended)

1. Update Scene API calls to match current implementation
2. Fix action function signatures (remove 5th parameter references)
3. Add proper line height type conversions
4. Add MathJax translation keys to locale files
5. Rebuild and test

**Estimated Time**: 2-3 hours of careful API alignment

### Option 2: Use TypeScript Workarounds

1. Add `// @ts-expect-error` comments for known incompatibilities
2. Cast types where necessary
3. Focus on getting it working first, fix types later

**Estimated Time**: 30 minutes, but less type-safe

### Option 3: Simplify First Implementation

1. Comment out complex UI interactions
2. Focus on core math rendering only
3. Add UI features incrementally

**Estimated Time**: 1 hour for basic functionality

## Testing Plan

Once the build succeeds:

1. **Start Dev Server**

   ```bash
   yarn start
   ```

2. **Test Math Element Creation**

   - Look for "Math" button in shape toolbar
   - Click to activate math mode
   - Type text element with math notation

3. **Test TeX Input**

   - Use LaTeX delimiters: `$x^2 + y^2 = r^2$`
   - Should render as formatted math

4. **Test AsciiMath Input**

   - Use backtick delimiters: `` `x^2 + y^2 = r^2` ``
   - Simpler syntax for basic math

5. **Test Math-Only Mode**

   - Toggle to render entire text as math (no mixed content)

6. **Test SVG Export**
   - Export drawing with math elements to SVG
   - Verify math renders correctly in exported file

## Files Modified

### Core Files

- `package.json` - Added patch-package
- `packages/excalidraw/package.json` - Added mathjax-full
- `yarn.lock` - Dependency resolution

### Element System

- `packages/element/src/types.ts` - Added subtype field
- `packages/element/src/newElement.ts` - Subtype selection support

### Excalidraw Package

- `packages/excalidraw/types.ts` - AppState and API updates
- `packages/excalidraw/components/App.tsx` - addSubtype implementation
- `packages/excalidraw/index.tsx` - Export useMathSubtype
- `packages/excalidraw/actions/types.ts` - CustomActionName support
- `packages/excalidraw/actions/shortcuts.ts` - Custom shortcuts
- `packages/excalidraw/i18n.ts` - Custom lang data registration

### New Files

- `patches/mathjax-full+3.2.2.patch` - MathJax browser compatibility
- `packages/excalidraw/subtypes/` - Complete subtype system (7 files)
- `packages/excalidraw/components/Subtypes.tsx` - Subtype UI components

## API Changes Summary

### New Element Fields

```typescript
interface ExcalidrawElement {
  subtype?: string;
  customData?: Record<string, any>;
}
```

### New AppState Fields

```typescript
interface AppState {
  activeSubtypes?: string[];
  customData?: Record<string, Record<string, any>>;
}
```

### New API Method

```typescript
interface ExcalidrawImperativeAPI {
  addSubtype: (
    record: SubtypeRecord,
    subtypePrepFn: SubtypePrepFn,
  ) => {
    actions: readonly Action[] | null;
    methods: Partial<SubtypeMethods>;
  };
}
```

### Using the Math Subtype

```typescript
import { Excalidraw, useMathSubtype } from "@excalidraw/excalidraw";

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Initialize math subtype
  useMathSubtype(excalidrawAPI);

  return <Excalidraw ref={setExcalidrawAPI} />;
}
```

## Next Steps

1. **Immediate**: Fix the 17 TypeScript type errors
2. **Then**: Add missing translation keys
3. **Test**: Verify math rendering works
4. **Optional**: Add ButtonIconSelect or use alternative component
5. **Document**: Add user-facing documentation for math feature
6. **Optimize**: Review performance with large math expressions

## Resources

- **Original Branch**: `remotes/origin/danieljgeiger-mathjax-maint-stage`
- **MathJax Docs**: https://docs.mathjax.org/
- **Patch File**: `patches/mathjax-full+3.2.2.patch`
- **Test Files**: `packages/excalidraw/subtypes/mathjax/tests/`

## Notes

- The subtype system is designed to be generic - it can support other element subtypes beyond math (e.g., charts, diagrams)
- MathJax loads lazily only when a math element is created
- Math is rendered as SVG for export compatibility
- Two input modes: TeX (standard LaTeX) and AsciiMath (simplified)

---

**Status**: Ready for type error fixes and testing **Commit**: 4330e870 - "WIP: Add MathJax subtype system integration (partial)"
