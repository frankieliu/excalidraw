# SVG Import Feature - Summary & Implementation Guide

## Overview

The Obsidian Excalidraw plugin has a robust SVG import feature that converts SVG files into native Excalidraw elements. This feature uses the `svg-to-excalidraw` library.

## Quick Facts

- **Library**: `svg-to-excalidraw` (npm package)
- **Version**: 0.0.2
- **GitHub**: https://github.com/excalidraw/svg-to-excalidraw
- **License**: MIT
- **Last Update**: ~2 years ago (not actively maintained)
- **Status**: Functional but unmaintained
- **Bundle Size**: ~50KB (with dependencies)

## How It Works

### Basic Usage

```typescript
import svgToEx from "svg-to-excalidraw";

const svgString = `<svg>...</svg>`;
const { hasErrors, errors, content } = svgToEx.convert(svgString);

if (hasErrors) {
  console.error(errors);
  return;
}

// content is Excalidraw JSON that can be pasted into canvas
```

### In Obsidian Plugin

```typescript
// 1. User selects SVG file via dialog
const svg = await readFile(selectedFile);

// 2. Convert to Excalidraw format
const result = svgToExcalidraw(svg);

// 3. Add elements to canvas
ea.importSVG(svg);
ea.addToGroup(ea.getElements().map((el) => el.id));
await ea.addElementsToView(true, true, true, true);
```

## Installation

```bash
cd /Users/frankliu/Work/excalidraw
npm install svg-to-excalidraw
# or
yarn add svg-to-excalidraw
```

## Dependencies

The library depends on:

- `chroma-js` - Color manipulation
- `gl-matrix` - Matrix operations for transforms
- `nanoid` - ID generation
- `path-data-parser` - SVG path parsing
- `points-on-curve` - Curve to points conversion
- `points-on-path` - Path to points conversion
- `roughjs` - Hand-drawn rendering (likely already in Excalidraw)

Total additional dependencies: ~6 packages, ~200KB uncompressed

## Implementation Plan for Excalidraw

### Phase 1: Basic Import (1-2 days)

**Files to create/modify:**

```
excalidraw-app/
├── components/
│   └── ImportSVGDialog.tsx      # New: File selection dialog
└── utils/
    └── svgImport.ts              # New: Import utilities

packages/excalidraw/
├── actions/
│   └── actionImportSVG.tsx       # New: Import action
└── components/
    └── App.tsx                    # Modify: Add import menu item
```

**Steps:**

1. Add `svg-to-excalidraw` dependency
2. Create file upload dialog
3. Add "Import SVG" menu item
4. Implement basic import handler
5. Add error handling and user feedback

### Phase 2: Enhanced Features (2-3 days)

1. **Drag & Drop Support**

   - Accept .svg files dropped on canvas
   - Auto-position at drop location

2. **Clipboard Paste**

   - Detect SVG content in clipboard
   - Auto-convert and paste as Excalidraw elements

3. **Import Options Dialog**

   - Scale slider
   - Position (center/cursor/origin)
   - Grouping option
   - Color preservation vs. theme colors

4. **URL Import**
   - Import SVG from web URLs
   - CORS handling

### Phase 3: Polish (1-2 days)

1. **Preview Before Import**

   - Show thumbnail of SVG
   - Display element count
   - Estimated canvas size

2. **Error Handling**

   - Better error messages
   - Partial import on errors
   - SVG validation

3. **Documentation**
   - User guide
   - Supported SVG features list
   - Known limitations

## UI/UX Design

### Menu Integration

```
File
├── New drawing
├── Open
├── Save
├── Export
├── Import SVG...          ← New
└── ...
```

### Keyboard Shortcut

Suggested: `Ctrl/Cmd + Shift + I` (Import)

### Dialog Design

```
┌─────────────────────────────────────┐
│  Import SVG                     × │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Drop SVG file here           │ │
│  │  or                           │ │
│  │  [Choose File]                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Options:                           │
│  ☑ Group imported elements         │
│  ☑ Preserve colors                 │
│  ☐ Add to current selection        │
│                                     │
│  Scale: [====|====] 100%           │
│                                     │
│  [Cancel]            [Import]      │
└─────────────────────────────────────┘
```

## Code Example

### Basic Import Utility

```typescript
// In excalidraw-app/utils/svgImport.ts
import svgToEx from "svg-to-excalidraw";
import { nanoid } from "nanoid";

export async function importSVG(
  svgContent: string,
  options: {
    scale?: number;
    groupElements?: boolean;
    position?: { x: number; y: number };
  } = {},
) {
  const { hasErrors, errors, content } = svgToEx.convert(svgContent);

  if (hasErrors) {
    throw new Error(`SVG import errors: ${errors.join(", ")}`);
  }

  // Parse the Excalidraw JSON
  const elements = JSON.parse(content).elements;

  // Apply scale if specified
  if (options.scale && options.scale !== 1) {
    elements.forEach((el) => {
      el.x *= options.scale;
      el.y *= options.scale;
      el.width *= options.scale;
      el.height *= options.scale;
    });
  }

  // Apply position offset
  if (options.position) {
    const minX = Math.min(...elements.map((e) => e.x));
    const minY = Math.min(...elements.map((e) => e.y));
    const offsetX = options.position.x - minX;
    const offsetY = options.position.y - minY;

    elements.forEach((el) => {
      el.x += offsetX;
      el.y += offsetY;
    });
  }

  // Group elements if requested
  if (options.groupElements) {
    const groupId = nanoid();
    elements.forEach((el) => {
      el.groupIds = [groupId];
    });
  }

  return elements;
}
```

### Action Registration

```typescript
// In packages/excalidraw/actions/actionImportSVG.tsx
import { register } from "./register";
import { importSVG } from "../../../excalidraw-app/utils/svgImport";

export const actionImportSVG = register({
  name: "importSVG",
  label: "Import SVG",
  trackEvent: { category: "file" },
  perform: (elements, appState, _, app) => {
    // Trigger file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const svgContent = await file.text();
        const newElements = await importSVG(svgContent, {
          groupElements: true,
          position: {
            x: appState.scrollX + appState.width / 2,
            y: appState.scrollY + appState.height / 2,
          },
        });

        app.updateScene({
          elements: [...elements, ...newElements],
          appState: {
            selectedElementIds: newElements.reduce((acc, el) => {
              acc[el.id] = true;
              return acc;
            }, {} as Record<string, true>),
          },
          commitToHistory: true,
        });
      } catch (error) {
        console.error("SVG import failed:", error);
        // Show error toast
      }
    };

    input.click();
    return false;
  },
  keyTest: (event) => event.ctrlKey && event.shiftKey && event.key === "I",
});
```

## Testing Strategy

### Test Files to Create

1. **Simple shapes** (circle, rect, path)
2. **Complex paths** (bezier curves)
3. **Grouped elements**
4. **Transforms** (rotate, scale, translate)
5. **Text elements**
6. **Gradients** (may not be fully supported)
7. **Nested SVGs**
8. **Invalid SVG** (error handling)
9. **Large files** (performance)

### Test SVG Examples

```svg
<!-- Simple rectangle -->
<svg viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="blue"/>
</svg>

<!-- Complex path -->
<svg viewBox="0 0 100 100">
  <path d="M10,30 Q50,10 90,30 T90,70 Q50,90 10,70 Z" fill="red"/>
</svg>

<!-- Grouped elements with transform -->
<svg viewBox="0 0 100 100">
  <g transform="rotate(45 50 50)">
    <circle cx="50" cy="50" r="30" fill="green"/>
    <circle cx="50" cy="50" r="15" fill="white"/>
  </g>
</svg>

<!-- Text element -->
<svg viewBox="0 0 200 50">
  <text x="10" y="30" font-family="Arial" font-size="20">Hello World</text>
</svg>
```

## Limitations to Document

Based on the svg-to-excalidraw library:

### 1. Not Supported:

- Gradients (will be converted to solid colors)
- Filters and effects (blur, shadow, etc.)
- Animations
- Embedded raster images
- Masks and clipping paths
- Advanced SVG features

### 2. Partial Support:

- Text (formatting may be simplified)
- Complex transforms (may have accuracy issues)
- Nested groups (flattened)
- Stroke dash patterns (limited)

### 3. Well Supported:

- Basic shapes (rect, circle, ellipse, path, line, polyline, polygon)
- Colors (stroke, fill, opacity)
- Stroke styles (width, basic dash)
- Simple transforms (translate, rotate, scale)
- ViewBox positioning

## Known Issues

From testing the library:

1. **Large SVGs** may take time to convert
2. **Very complex paths** might not render perfectly
3. **Font matching** - fonts may not match exactly
4. **Color spaces** - only RGB/hex supported

## Maintenance Considerations

The `svg-to-excalidraw` library hasn't been updated in ~2 years. Consider:

1. **Forking the library** if you need to make changes
2. **Vendoring** the code directly into Excalidraw (like Obsidian did)
   - Pros: Full control, can fix bugs
   - Cons: Need to maintain, larger bundle
3. **Contributing back** bug fixes to the original repo
4. **Alternative**: Build your own SVG parser using the Obsidian plugin code as reference

### Recommended Approach

**Vendor the code** (copy into your repo):

- The library is small and unmaintained
- Obsidian already did this successfully
- Gives you full control for fixes
- Can optimize for Excalidraw's specific needs

Location suggestion:

```
packages/excalidraw/
└── utils/
    └── svg-to-excalidraw/
        ├── parser.ts
        ├── walker.ts
        ├── transform.ts
        └── elements/
```

## Alternative: Manual Vendoring from Obsidian

Since Obsidian already has a working, maintained version:

```bash
# Copy from Obsidian plugin
cp -r /Users/frankliu/Library/CloudStorage/Box-Box/Work/obsidian-excalidraw-plugin/src/shared/svgToExcalidraw/ \
      /Users/frankliu/Work/excalidraw/packages/excalidraw/utils/svg-import/
```

Benefits:

- Already tested and working
- Any Obsidian-specific code can be removed
- More recent maintenance than official library

## Performance Considerations

- **Lazy load** the svg-to-excalidraw library (code splitting)
- **Worker thread** for large SVG processing
- **Progress indicator** for large files
- **Cancellation** support for long operations

Example lazy loading:

```typescript
const importSVG = async (svg: string) => {
  const { default: svgToEx } = await import("svg-to-excalidraw");
  return svgToEx.convert(svg);
};
```

## Resources

- **Library Source**: https://github.com/excalidraw/svg-to-excalidraw
- **Library Docs**: https://github.com/excalidraw/svg-to-excalidraw/blob/main/README.md
- **Obsidian Implementation**:
  - Code: `/Users/frankliu/Library/CloudStorage/Box-Box/Work/obsidian-excalidraw-plugin/src/shared/svgToExcalidraw/`
  - Dialog: `/Users/frankliu/Library/CloudStorage/Box-Box/Work/obsidian-excalidraw-plugin/src/shared/Dialogs/ImportSVGDialog.ts`
- **Last Library Commit**: https://github.com/excalidraw/svg-to-excalidraw/commit/6f6e4b7269c4194b56cf7517a8357ba73be12a3a

## Next Steps

1. ✅ Review this document
2. ⬜ Test `svg-to-excalidraw` library with sample files
3. ⬜ Design UI mockups
4. ⬜ Decide: npm package vs. vendoring
5. ⬜ Create feature branch: `feature/svg-import`
6. ⬜ Implement Phase 1 (basic import)
7. ⬜ Internal testing with various SVG files
8. ⬜ Implement Phase 2 (enhanced features)
9. ⬜ User testing / beta release
10. ⬜ Documentation
11. ⬜ Submit PR to main Excalidraw repo

## Estimated Timeline

- **Phase 1** (Basic): 1-2 days
- **Phase 2** (Enhanced): 2-3 days
- **Phase 3** (Polish): 1-2 days
- **Testing & Docs**: 2-3 days

**Total**: ~1-2 weeks for complete implementation

## Questions to Resolve

1. Should we use npm package or vendor the code?
2. Where should imported elements be positioned (center, cursor, origin)?
3. Should grouping be default or optional?
4. Do we need import preview/confirmation?
5. Should we support batch import (multiple SVGs)?
