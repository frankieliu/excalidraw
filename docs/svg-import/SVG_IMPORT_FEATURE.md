# SVG Import Feature - Implementation Guide

## Overview

This document describes the implementation of SVG import functionality in Excalidraw, allowing users to import SVG files and convert them to native Excalidraw elements.

## Features

- **File Import**: Import .svg files through a file picker dialog
- **Menu Integration**: Accessible via hamburger menu (☰) → "Import SVG..."
- **Keyboard Shortcut**: Ctrl/Cmd+Shift+I
- **Auto-positioning**: Imported elements are centered in the viewport
- **Auto-grouping**: All imported elements are grouped together
- **Error Handling**: Toast notifications for success/error states
- **Element Selection**: Imported elements are automatically selected

## Files Created

### 1. `/packages/excalidraw/actions/actionImportSVG.tsx`
**Purpose**: Core action implementation for SVG import

**Key functionality**:
- Creates hidden file input for .svg file selection
- Uses `svg-to-excalidraw` library to convert SVG to Excalidraw format
- Handles both string and object return types from the converter
- Groups imported elements with a unique group ID
- Uses `app.addElementsFromPasteOrLibrary()` to add elements at viewport center
- Shows toast notifications for success/errors
- Keyboard shortcut handler: Ctrl/Cmd+Shift+I

**Dependencies**:
```typescript
import { register } from "./register";
import { StoreAction } from "../store";
import { t } from "../i18n";
import { randomId } from "../random";
import { KEYS } from "../keys";
import type { ExcalidrawElement } from "../element/types";
import { newElementWith } from "../element/mutateElement";
import svgToEx from "svg-to-excalidraw";
```

## Files Modified

### 1. `/packages/excalidraw/actions/index.ts`
**Change**: Added export for `actionImportSVG`
```typescript
export { actionImportSVG } from "./actionImportSVG";
```

### 2. `/packages/excalidraw/actions/types.ts`
**Change**: Added "importSVG" to the ActionName type union
```typescript
export type ActionName =
  | CustomActionName
  // ... existing actions
  | "importSVG";
```

### 3. `/packages/excalidraw/actions/shortcuts.ts`
**Changes**:
- Added "importSVG" to ShortcutName type
- Registered Ctrl/Cmd+Shift+I keyboard shortcut

```typescript
export type ShortcutName =
  // ... existing shortcuts
  | "importSVG"
  | "commandPalette"
  | "searchMenu";

const shortcutMap: Record<ShortcutName, string[]> = {
  // ... existing shortcuts
  importSVG: [getShortcutKey("CtrlOrCmd+Shift+I")],
  // ... rest of shortcuts
};
```

### 4. `/packages/excalidraw/locales/en.json`
**Changes**: Added localization strings for SVG import

```json
{
  "labels": {
    "importSVG": "Import SVG..."
  },
  "toast": {
    "importSVGError": "SVG import errors: {{error}}",
    "noElementsImported": "No elements found in SVG",
    "importedElements": "Imported {{count}} elements from SVG",
    "importSVGFailed": "Failed to import SVG: {{error}}"
  }
}
```

### 5. `/packages/excalidraw/components/main-menu/DefaultItems.tsx`
**Changes**:
- Imported `actionImportSVG`
- Created `ImportSVG` component for the menu item

```typescript
import { actionImportSVG } from "../../actions";

export const ImportSVG = () => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();

  if (!actionManager.isActionEnabled(actionImportSVG)) {
    return null;
  }

  return (
    <DropdownMenuItem
      icon={LoadIcon}
      onSelect={() => actionManager.executeAction(actionImportSVG)}
      data-testid="import-svg-button"
      shortcut={getShortcutFromShortcutName("importSVG")}
      aria-label={t("labels.importSVG")}
    >
      {t("labels.importSVG")}
    </DropdownMenuItem>
  );
};
```

### 6. `/excalidraw-app/components/AppMainMenu.tsx`
**Change**: Added ImportSVG menu item after LoadScene

```typescript
return (
  <MainMenu>
    <MainMenu.DefaultItems.LoadScene />
    <MainMenu.DefaultItems.ImportSVG />  {/* NEW */}
    <MainMenu.DefaultItems.SaveToActiveFile />
    // ... rest of menu items
  </MainMenu>
);
```

### 7. `/packages/excalidraw/package.json`
**Change**: Added svg-to-excalidraw as a file dependency

```json
{
  "dependencies": {
    "svg-to-excalidraw": "file:../../../svg-to-excalidraw",
    // ... other dependencies
  }
}
```

## Dependencies

### svg-to-excalidraw
- **Location**: `/Users/frankliu/Library/CloudStorage/Box-Box/Work/svg-to-excalidraw`
- **Type**: Local file dependency
- **Purpose**: Converts SVG markup to Excalidraw's native element format
- **Installation**: Automatically linked via `file:` protocol in package.json

## Setup Instructions

### Prerequisites
- Node.js v18-20 (or use `--ignore-engines` flag)
- Yarn package manager
- Local svg-to-excalidraw library at `../../../svg-to-excalidraw` relative to `/packages/excalidraw`

### Installation Steps

1. **Navigate to project directory**:
   ```bash
   cd /Users/frankliu/Work/excalidraw
   ```

2. **Install dependencies**:
   ```bash
   yarn install --ignore-engines
   ```

3. **Apply MathJax patches** (required for math branch):
   ```bash
   npx patch-package --patch-dir patches
   ```

4. **Start development server**:
   ```bash
   cd excalidraw-app
   npx vite
   ```

### Single-Command Startup

Add this to `/package.json` scripts section:
```json
{
  "scripts": {
    "dev": "cd excalidraw-app && npx vite"
  }
}
```

Then run from project root:
```bash
yarn dev
```

Or create a shell script `start-excalidraw.sh`:
```bash
#!/bin/bash
cd /Users/frankliu/Work/excalidraw
yarn install --ignore-engines 2>/dev/null || true
npx patch-package --patch-dir patches
cd excalidraw-app
npx vite
```

Make it executable and run:
```bash
chmod +x start-excalidraw.sh
./start-excalidraw.sh
```

## Running the Application

### Method 1: Manual Steps
```bash
cd /Users/frankliu/Work/excalidraw
yarn install --ignore-engines  # Only needed after dependency changes
npx patch-package --patch-dir patches  # Only needed after yarn install
cd excalidraw-app
npx vite
```

### Method 2: Using package.json script
```bash
cd /Users/frankliu/Work/excalidraw
yarn dev
```

The application will start at: **http://localhost:3000/**

## Using the Feature

### Via Menu
1. Open http://localhost:3000/
2. Click the hamburger menu (☰) in top-left corner
3. Click "Import SVG..."
4. Select an .svg file from your computer
5. SVG will be converted and added to canvas at center

### Via Keyboard
1. Press **Ctrl/Cmd+Shift+I**
2. Select an .svg file
3. SVG will be imported

### Success Indicators
- Toast notification: "Imported X elements from SVG"
- Elements appear grouped at viewport center
- Elements are automatically selected

### Error Handling
- Invalid SVG: Shows error toast with details
- Empty SVG: Shows "No elements found in SVG"
- Conversion failure: Shows "Failed to import SVG: [error]"

## Important Notes

### MathJax Patches
The project includes patches for MathJax to fix strict-mode compatibility. These patches must be reapplied after running `yarn install`:

```bash
npx patch-package --patch-dir patches
```

**Why?** The `postinstall` script in package.json should auto-apply patches, but it fails with Node v25 due to engine version checks. Manual application is required.

### Browser Cache
After code changes, do a **hard refresh**:
- Mac: Cmd+Shift+R
- Windows/Linux: Ctrl+Shift+R

This ensures the browser loads the latest code, especially after applying MathJax patches.

### Node Version
The project expects Node v18-20. If using Node v25:
- Use `--ignore-engines` flag with yarn/npm
- Manually apply patches after installation
- Some warning messages are expected but can be ignored

## Architecture Details

### Import Flow
1. User triggers action (menu or keyboard)
2. Action creates hidden `<input type="file">` element
3. User selects .svg file
4. File content is read as text
5. `svg-to-excalidraw` converts SVG to Excalidraw JSON
6. Elements are grouped with unique ID
7. `app.addElementsFromPasteOrLibrary()` adds elements at center
8. Elements are selected and toast notification shown

### Error Handling
- **Conversion errors**: Extracted from `errors` NodeList, displayed in toast
- **Empty results**: Checked before adding to canvas
- **Parse errors**: Caught and displayed with error message
- **Cleanup**: Input element removed in finally block

### Type Safety
- TypeScript types ensure compatibility
- ActionName, ShortcutName extended to include "importSVG"
- Handles both string and object return types from converter

## Testing

### Test SVG Files
Create simple test files to verify functionality:

**test-circle.svg**:
```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="blue" stroke="navy" stroke-width="2"/>
</svg>
```

**test-shapes.svg**:
```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="blue"/>
  <rect x="110" y="10" width="80" height="80" fill="red"/>
  <path d="M100,150 L110,140 Q120,130 120,120" fill="pink"/>
</svg>
```

### Expected Behavior
- ✅ SVG imported at viewport center
- ✅ All elements grouped together
- ✅ Elements selected after import
- ✅ Toast shows element count
- ✅ Keyboard shortcut works
- ✅ Menu item appears and functions

## Troubleshooting

### Error: "arguments.callee in strict mode"
**Cause**: MathJax patches not applied
**Solution**: Run `npx patch-package --patch-dir patches`

### Error: "importSVG is not assignable to ActionName"
**Cause**: TypeScript types not updated
**Solution**: Verify changes to `actions/types.ts` and restart TypeScript server

### Error: "svg-to-excalidraw not found"
**Cause**: Local package not linked
**Solution**: Verify svg-to-excalidraw exists at `../../../svg-to-excalidraw` and run `yarn install`

### Import succeeds but elements not visible
**Cause**: Elements positioned off-screen
**Solution**: Check viewport zoom/position, elements should appear at center

### "No elements found in SVG"
**Cause**: SVG file is empty or has no convertible elements
**Solution**: Verify SVG file contains valid shapes/paths

## Future Enhancements

Potential improvements:
- [ ] Drag & drop SVG files onto canvas
- [ ] Paste SVG from clipboard
- [ ] Import options dialog (scale, position, grouping)
- [ ] Preview before import
- [ ] Batch import multiple SVGs
- [ ] Import from URL
- [ ] Progress indicator for large files

## Related Files

- Math branch patches: `/patches/mathjax-full+3.2.2.patch`
- SVG converter: `/Users/frankliu/Library/CloudStorage/Box-Box/Work/svg-to-excalidraw`
- Documentation: `MATH_SETUP.md`, `QUICKSTART_MATH.md`

## Credits

- SVG to Excalidraw conversion: [svg-to-excalidraw](https://github.com/excalidraw/svg-to-excalidraw)
- Implementation reference: [obsidian-excalidraw-plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin)
