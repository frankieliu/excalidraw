# SVG Import Integration - Using Local svg-to-excalidraw

## Quick Integration Plan

Since you have a working local version at `../svg-to-excalidraw`, we can integrate it directly.

## Step 1: Link Local Package

```bash
cd /Users/frankliu/Library/CloudStorage/Box-Box/Work/svg-to-excalidraw
npm link

cd /Users/frankliu/Work/excalidraw
npm link svg-to-excalidraw
```

**Alternative: Direct file reference in package.json**

```json
{
  "dependencies": {
    "svg-to-excalidraw": "file:../svg-to-excalidraw"
  }
}
```

## Step 2: Create Import Action

### File: `packages/excalidraw/actions/actionImportSVG.ts`

```typescript
import { register } from "./register";
import svgToEx from "svg-to-excalidraw";
import { nanoid } from "nanoid";
import type { ExcalidrawElement } from "../element/types";

export const actionImportSVG = register({
  name: "importSVG",
  label: "Import SVG",
  icon: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
    </svg>
  ),
  trackEvent: { category: "file" },
  perform: (elements, appState, _, app) => {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";
    input.style.display = "none";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const svgContent = await file.text();

        // Convert SVG using your local library
        const { hasErrors, errors, content } = svgToEx.convert(svgContent);

        if (hasErrors) {
          app.setToast({
            message: `SVG import errors: ${errors.join(", ")}`,
            closable: true,
            duration: 5000,
          });
          return;
        }

        // Parse the result
        const result = JSON.parse(content);
        const newElements = result.elements || [];

        // Position at center of viewport
        const viewportCenter = {
          x: appState.scrollX + appState.width / 2,
          y: appState.scrollY + appState.height / 2,
        };

        // Calculate bounds
        const minX = Math.min(...newElements.map((e: any) => e.x));
        const minY = Math.min(...newElements.map((e: any) => e.y));
        const offsetX = viewportCenter.x - minX;
        const offsetY = viewportCenter.y - minY;

        // Apply offset and group
        const groupId = nanoid();
        newElements.forEach((el: ExcalidrawElement) => {
          el.x += offsetX;
          el.y += offsetY;
          el.groupIds = [groupId];
        });

        // Add to scene
        app.updateScene({
          elements: [...elements, ...newElements],
          appState: {
            ...appState,
            selectedElementIds: newElements.reduce(
              (acc: Record<string, boolean>, el: ExcalidrawElement) => {
                acc[el.id] = true;
                return acc;
              },
              {},
            ),
          },
          commitToHistory: true,
        });

        app.setToast({
          message: `Imported ${newElements.length} elements from SVG`,
          closable: true,
          duration: 3000,
        });
      } catch (error: any) {
        console.error("SVG import failed:", error);
        app.setToast({
          message: `Failed to import SVG: ${error.message}`,
          closable: true,
          duration: 5000,
        });
      }

      // Cleanup
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();

    return false;
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.I,
});
```

## Step 3: Register Action

### File: `packages/excalidraw/actions/index.tsx`

```typescript
// Add to imports
export { actionImportSVG } from "./actionImportSVG";

// Add to actionManager (in appropriate section)
actionImportSVG,
```

## Step 4: Add Menu Item

### File: `packages/excalidraw/components/App.tsx` (or appropriate menu file)

Add to File menu or create new Import menu:

```typescript
<MenuItem
  label={t("labels.importSVG")}
  onClick={() => {
    actionManager.executeAction(actionImportSVG);
  }}
  icon={actionImportSVG.icon}
  shortcut={getShortcutFromShortcutName("importSVG")}
/>
```

## Step 5: Add Localization

### File: `packages/excalidraw/locales/en.json`

```json
{
  "labels": {
    "importSVG": "Import SVG..."
  },
  "toast": {
    "importedElements": "Imported {{count}} elements from SVG",
    "importSVGError": "Failed to import SVG: {{error}}"
  }
}
```

## Step 6: Add Drag & Drop Support (Optional)

### File: `packages/excalidraw/components/App.tsx`

In the existing drop handler:

```typescript
const handleDrop = async (event: DragEvent) => {
  // ... existing code ...

  // Check for SVG files
  const svgFiles = Array.from(event.dataTransfer?.files || []).filter(
    (file) => file.type === "image/svg+xml" || file.name.endsWith(".svg"),
  );

  if (svgFiles.length > 0) {
    event.preventDefault();

    for (const file of svgFiles) {
      const svgContent = await file.text();
      const { hasErrors, errors, content } = svgToEx.convert(svgContent);

      if (!hasErrors) {
        const result = JSON.parse(content);
        const newElements = result.elements || [];

        // Position at drop location
        const dropPoint = viewportCoordsToSceneCoords(
          { clientX: event.clientX, clientY: event.clientY },
          appState,
        );

        // ... add elements with positioning
      }
    }
  }
};
```

## Quick Test Commands

### Test the CLI

```bash
cd /Users/frankliu/Library/CloudStorage/Box-Box/Work/svg-to-excalidraw

# Test with a sample SVG
echo '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>' | \
  ./bin/svg-to-excalidraw.js - -p

# Or test with a file
./bin/svg-to-excalidraw.js /path/to/test.svg -o output.excalidraw -p
```

### Test in Excalidraw

```bash
cd /Users/frankliu/Work/excalidraw

# 1. Link the local package
npm link ../svg-to-excalidraw

# 2. Build excalidraw
yarn build

# 3. Start dev server
cd excalidraw-app && npx vite
```

## Simple Test SVGs

Create `test.svg`:

```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle -->
  <circle cx="50" cy="50" r="40" fill="blue" stroke="navy" stroke-width="2"/>

  <!-- Rectangle -->
  <rect x="110" y="10" width="80" height="80" fill="red" stroke="darkred" stroke-width="2"/>

  <!-- Path (heart shape) -->
  <path d="M100,150 L110,140 Q120,130 120,120 Q120,110 110,110 Q105,110 100,115 Q95,110 90,110 Q80,110 80,120 Q80,130 90,140 Z"
        fill="pink" stroke="red" stroke-width="2"/>
</svg>
```

## Implementation Checklist

### Core Functionality

- [ ] Link local svg-to-excalidraw package
- [ ] Create actionImportSVG.ts
- [ ] Register action in index
- [ ] Add menu item
- [ ] Add localization strings
- [ ] Test with simple SVG

### Enhanced Features

- [ ] Add drag & drop support
- [ ] Add paste from clipboard support
- [ ] Add import options dialog (scale, position, grouping)
- [ ] Add loading indicator for large files
- [ ] Add error handling and user feedback

### Polish

- [ ] Add import preview
- [ ] Add batch import support
- [ ] Handle multiple SVGs at once
- [ ] Add undo/redo support
- [ ] Add keyboard shortcut (Ctrl/Cmd+Shift+I)

### Testing

- [ ] Test with simple shapes
- [ ] Test with complex paths
- [ ] Test with text elements
- [ ] Test with transforms
- [ ] Test with nested groups
- [ ] Test error cases (invalid SVG)
- [ ] Test large SVG files

## File Structure

```
excalidraw/
├── packages/
│   └── excalidraw/
│       ├── actions/
│       │   ├── actionImportSVG.ts         ← New
│       │   └── index.tsx                   ← Modify
│       ├── components/
│       │   └── App.tsx                     ← Modify (menu)
│       └── locales/
│           └── en.json                     ← Modify
└── node_modules/
    └── svg-to-excalidraw/                  ← Linked from ../
```

## Expected Bundle Size Impact

Adding svg-to-excalidraw will add:

- Core library: ~50KB gzipped
- Dependencies (if not already present):
  - chroma-js: ~13KB
  - gl-matrix: ~10KB
  - nanoid: ~1KB (likely already present)
  - points-on-path/curve: ~5KB
  - roughjs: already in Excalidraw

**Total estimated impact**: ~70-80KB gzipped

## Next Steps

1. **Link the package**: `cd ../svg-to-excalidraw && npm link`
2. **Install in Excalidraw**: `cd /Users/frankliu/Work/excalidraw && npm link svg-to-excalidraw`
3. **Create actionImportSVG.ts** with the code above
4. **Test it**: Import a simple SVG file
5. **Iterate**: Add drag & drop, options dialog, etc.

Would you like me to create the implementation files now?
