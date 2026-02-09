# File Handling & UI Improvements

**Date**: 2026-02-09
**Author**: Claude (AI Assistant)

## Overview

This document describes improvements made to the file handling and user interface experience in Excalidraw, specifically addressing two key issues:

1. "Save to current file" menu option not appearing after opening a file
2. Browser tab title not showing the current filename

## Changes Summary

### 1. Fixed "Save to Current File" Menu Option

**Problem**: After opening a `.excalidraw` file via the hamburger menu, the "Save to current file" option would not appear, even though a file was open. However, after saving a file using "Save As", the option would correctly appear.

**Root Cause**: The `normalizeFile` function in `packages/excalidraw/data/blob.ts` was creating a new `File` object to ensure correct MIME types, but this process was losing the `handle` property attached by the File System Access API. Without this handle, `appState.fileHandle` remained `null`, preventing the menu item from appearing.

**Solution**: Modified the `normalizeFile` function to preserve and restore the file handle:

```typescript
// packages/excalidraw/data/blob.ts (line 466)

export const normalizeFile = async (file: File) => {
  // to prevent double normalization (perf optim)
  if ((file as any)[normalizedFileSymbol]) {
    return file;
  }

  // Preserve the file handle if it exists (from File System Access API)
  const originalHandle = (file as any).handle;

  if (file?.name?.endsWith(".excalidrawlib")) {
    file = createFile(file, MIME_TYPES.excalidrawlib, file.name);
  } else if (file?.name?.endsWith(".excalidraw")) {
    file = createFile(file, MIME_TYPES.excalidraw, file.name);
  } else if (!file.type || file.type?.startsWith("image/")) {
    const mimeType = await getActualMimeTypeFromImage(file);
    if (mimeType && mimeType !== file.type) {
      file = createFile(file, mimeType, file.name);
    }
  }

  // Restore the file handle after creating a new File object
  if (originalHandle) {
    (file as any).handle = originalHandle;
  }

  (file as any)[normalizedFileSymbol] = true;

  return file;
};
```

**Files Modified**:
- `packages/excalidraw/data/blob.ts`

### 2. Dynamic Browser Tab Title

**Problem**: The browser tab always displayed "Excalidraw Whiteboard", making it difficult to distinguish between multiple open Excalidraw files in different tabs.

**Solution**: Added dynamic tab title updates that show the current filename when a file is open:

```typescript
// excalidraw-app/App.tsx (lines 662-698)

// Update document title when a file is opened or saved
useEffect(() => {
  if (!excalidrawAPI) {
    return;
  }

  const updateDocumentTitle = () => {
    const appState = excalidrawAPI.getAppState();
    const fileHandle = appState.fileHandle;

    if (fileHandle && fileHandle.name) {
      // Remove .excalidraw extension and set title
      const filename = fileHandle.name.replace(/\.excalidraw$/, "");
      document.title = `Excalidraw: ${filename}`;
    } else {
      // Reset to default title if no file is open
      document.title = "Excalidraw Whiteboard";
    }
  };

  // Update immediately when excalidrawAPI becomes available
  updateDocumentTitle();
}, [excalidrawAPI]);

const onChange = (
  elements: readonly OrderedExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
) => {
  // Update document title when appState changes
  const fileHandle = appState.fileHandle;
  if (fileHandle && fileHandle.name) {
    const filename = fileHandle.name.replace(/\.excalidraw$/, "");
    document.title = `Excalidraw: ${filename}`;
  } else if (!document.title.includes("Excalidraw Whiteboard")) {
    document.title = "Excalidraw Whiteboard";
  }

  // ... rest of onChange logic
};
```

**Behavior**:
- When no file is open: `Excalidraw Whiteboard`
- When a file is open: `Excalidraw: <filename>` (without `.excalidraw` extension)
- Title updates automatically when:
  - The app loads with a file
  - A file is opened
  - A file is saved with a new name

**Files Modified**:
- `excalidraw-app/App.tsx`

## Technical Details

### File Handle Flow

The file handle flows through the application as follows:

1. **File Opening**:
   - User clicks "Open" in hamburger menu
   - `fileOpen()` from `browser-fs-access` library is called
   - Browser's File System Access API attaches a `handle` property to the File object
   - `normalizeFile()` processes the file and now preserves the handle
   - `loadFromBlob()` passes the handle to `loadSceneOrLibraryFromBlob()`
   - Handle is stored in `appState.fileHandle`

2. **Menu Visibility**:
   - `actionSaveToActiveFile` predicate checks `!!appState.fileHandle`
   - If fileHandle exists, "Save to current file" menu item appears
   - Menu item is rendered by `SaveToActiveFile` component in `DefaultItems.tsx`

3. **Title Updates**:
   - `useEffect` hook monitors `excalidrawAPI` availability
   - `onChange` function monitors appState changes
   - Title is updated whenever fileHandle changes

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `normalizeFile` | `packages/excalidraw/data/blob.ts` | Normalizes file MIME types, now preserves handle |
| `fileOpen` | `packages/excalidraw/data/filesystem.ts` | Opens file picker, calls normalizeFile |
| `loadFromJSON` | `packages/excalidraw/data/json.ts` | Loads JSON files, passes handle through |
| `actionSaveToActiveFile` | `packages/excalidraw/actions/actionExport.tsx` | Save action, checks fileHandle in predicate |
| `ExcalidrawWrapper` | `excalidraw-app/App.tsx` | Main app component, manages title updates |

## Testing

### Manual Testing Steps

1. **Test "Save to current file" fix**:
   ```
   1. Start dev server: yarn dev
   2. Open Excalidraw in browser
   3. Click hamburger menu → Open
   4. Select a .excalidraw file
   5. Verify "Save to current file" appears in menu
   6. Make changes to the drawing
   7. Click "Save to current file"
   8. Verify file is saved
   ```

2. **Test tab title update**:
   ```
   1. Start dev server: yarn dev
   2. Open Excalidraw in browser
   3. Verify tab shows "Excalidraw Whiteboard"
   4. Click hamburger menu → Open
   5. Select a file named "my-drawing.excalidraw"
   6. Verify tab shows "Excalidraw: my-drawing"
   7. Open multiple tabs with different files
   8. Verify each tab shows the correct filename
   ```

### Expected Behavior

- ✅ "Save to current file" appears after opening a file
- ✅ Tab title updates to show filename (without extension)
- ✅ Tab title resets to default when starting a new drawing
- ✅ Changes persist across page reloads (via localStorage)

## Browser Compatibility

### File System Access API Support

The file handle preservation requires the File System Access API, which is supported in:

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+
- ⚠️ Safari 15.2+ (limited support)
- ❌ Firefox (not supported, uses fallback)

The `browser-fs-access` library provides fallbacks for unsupported browsers, but the file handle will only be preserved in browsers that support the full File System Access API.

## Known Limitations

1. **Firefox**: File handles are not preserved in Firefox due to lack of File System Access API support. The "Save to current file" feature will not work in Firefox.

2. **File Handle Persistence**: File handles cannot be persisted across browser sessions due to security restrictions. When the page is reloaded, the file must be reopened to re-establish the handle.

3. **Legacy Browser Support**: Older browsers fall back to traditional file input, which doesn't provide file handles.

## Future Improvements

Potential enhancements for consideration:

1. **Persistent File Handle**: Explore using IndexedDB to persist file handles across sessions (where supported by File System Access API)
2. **Tab Icon**: Add a favicon indicator when a file is open
3. **Unsaved Changes Indicator**: Show "*" in tab title when there are unsaved changes
4. **Recent Files**: Maintain a list of recently opened files with their handles

## Related Issues

This fix addresses issues related to:
- File System Access API integration
- File handle management
- User experience improvements
- Browser tab management

## References

- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [browser-fs-access library](https://github.com/GoogleChromeLabs/browser-fs-access)
- Excalidraw action system: `packages/excalidraw/actions/`
- Excalidraw data layer: `packages/excalidraw/data/`

---

**Status**: ✅ Implemented and tested
**Version**: Excalidraw Fork (2026-02-09)
