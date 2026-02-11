# File Handle Persistence Across Page Reloads

**Date**: 2026-02-10 **Status**: 📋 Proposed **Related**: [FILE_HANDLING_IMPROVEMENTS.md](./FILE_HANDLING_IMPROVEMENTS.md)

## Problem Statement

When users reload the page in Excalidraw, the canvas content is preserved via localStorage, but the connection to the current file is lost. This means:

- ❌ The "Save to current file" menu option disappears after reload
- ❌ Users must reopen the file or use "Save As" to continue working
- ❌ The document title resets to "Excalidraw Whiteboard" instead of showing the filename
- ✅ Canvas elements and images are preserved (via localStorage and IndexedDB)

This creates a confusing user experience where the drawing is remembered but the file association is forgotten.

## Root Cause Analysis

### What's Persisted vs Lost

**Currently Saved (survives reload):**

- ✅ Canvas elements → `localStorage["excalidraw"]`
- ✅ Binary files/images → `IndexedDB["files-db"]["files-store"]`
- ✅ File name → `localStorage["excalidraw-state"]` (as `appState.name`)
- ✅ UI preferences, zoom, scroll position
- ✅ Library items → `IndexedDB["excalidraw-library-db"]`

**Currently Lost (doesn't survive reload):**

- ❌ **File handle** (`appState.fileHandle`)
- ❌ File path information
- ❌ File write permissions

### Why File Handles Aren't Persisted

**Configuration**: In `packages/excalidraw/appState.ts:191`, file handles are explicitly excluded from persistence:

```typescript
fileHandle: { browser: false, export: false, server: false }
```

**Technical Limitation**: `FileSystemFileHandle` objects **cannot be serialized to JSON** for localStorage storage. They are complex objects that represent system-level file access permissions.

**Browser Security**: File handles contain security-sensitive information about the user's filesystem. They can only be obtained through explicit user actions (file picker, drag-drop).

## Proposed Solution

### Use IndexedDB for File Handle Storage

Unlike localStorage, **IndexedDB can store structured objects** including `FileSystemFileHandle` instances directly. The File System Access API was designed to work with IndexedDB for persistence.

### Implementation Approach

#### 1. Add IndexedDB Store for File Handles

Create a new IndexedDB database alongside the existing `"files-db"`:

```typescript
// In excalidraw-app/data/LocalData.ts

const FILE_HANDLE_DB_NAME = "excalidraw-filehandles-db";
const FILE_HANDLE_STORE_NAME = "handles";
const CURRENT_FILE_KEY = "current-file";

interface FileHandleEntry {
  handle: FileSystemFileHandle;
  savedAt: number;
  fileName: string;
}

class FileHandleStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDB();
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(FILE_HANDLE_DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(FILE_HANDLE_STORE_NAME)) {
          db.createObjectStore(FILE_HANDLE_STORE_NAME);
        }
      };
    });
  }

  async saveHandle(handle: FileSystemFileHandle): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(FILE_HANDLE_STORE_NAME, "readwrite");
    const store = tx.objectStore(FILE_HANDLE_STORE_NAME);

    const entry: FileHandleEntry = {
      handle,
      savedAt: Date.now(),
      fileName: handle.name,
    };

    store.put(entry, CURRENT_FILE_KEY);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getHandle(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(FILE_HANDLE_STORE_NAME, "readonly");
      const store = tx.objectStore(FILE_HANDLE_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(CURRENT_FILE_KEY);
        request.onsuccess = () => {
          const entry = request.result as FileHandleEntry | undefined;
          resolve(entry?.handle || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn("Failed to retrieve file handle:", error);
      return null;
    }
  }

  async clearHandle(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(FILE_HANDLE_STORE_NAME, "readwrite");
    const store = tx.objectStore(FILE_HANDLE_STORE_NAME);
    store.delete(CURRENT_FILE_KEY);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const fileHandleStorage = new FileHandleStorage();
```

#### 2. Save File Handle on File Operations

Hook into existing file operations to save the handle:

```typescript
// In excalidraw-app/data/FileManager.tsx or App.tsx

// After loading a file
const loadFileToCanvas = async (
  file: File,
  fileHandle?: FileSystemFileHandle,
) => {
  // ... existing file loading logic ...

  if (fileHandle) {
    await fileHandleStorage.saveHandle(fileHandle);
  }
};

// After saving a file
const saveToFile = async () => {
  const fileHandle = appState.fileHandle;

  // ... existing save logic ...

  if (fileHandle) {
    await fileHandleStorage.saveHandle(fileHandle);
  }
};
```

#### 3. Restore File Handle on Page Load

Add restoration logic in the app initialization:

```typescript
// In excalidraw-app/App.tsx

const initializeScene = async () => {
  // ... existing initialization logic ...

  // Try to restore file handle from IndexedDB
  const savedHandle = await fileHandleStorage.getHandle();

  if (savedHandle) {
    try {
      // CRITICAL: Request permission to use the handle
      const permission = await savedHandle.queryPermission({
        mode: "readwrite",
      });

      if (permission === "granted") {
        // Permission already granted, restore immediately
        excalidrawAPI.updateScene({
          appState: { fileHandle: savedHandle },
        });
      } else if (permission === "prompt") {
        // Need to request permission (browser will show prompt)
        const newPermission = await savedHandle.requestPermission({
          mode: "readwrite",
        });

        if (newPermission === "granted") {
          excalidrawAPI.updateScene({
            appState: { fileHandle: savedHandle },
          });
        } else {
          // Permission denied, clear the saved handle
          await fileHandleStorage.clearHandle();
        }
      } else {
        // Permission denied, clear the saved handle
        await fileHandleStorage.clearHandle();
      }
    } catch (error) {
      console.warn("Failed to restore file handle:", error);
      // File might have been deleted or moved
      await fileHandleStorage.clearHandle();
    }
  }
};
```

#### 4. Clear Handle on New Drawing

When starting a new drawing, clear the saved handle:

```typescript
// In action handlers for "New drawing" or similar

const createNewDrawing = async () => {
  await fileHandleStorage.clearHandle();

  // ... existing new drawing logic ...
};
```

### Permission Handling Strategy

The File System Access API requires re-requesting permissions after page reload:

1. **Query Permission**: Check if permission is still granted

   - `granted` → Restore handle immediately
   - `prompt` → Show browser permission dialog
   - `denied` → Clear saved handle

2. **Request Permission**: If needed, prompt user

   - Can be done silently on page load
   - Or defer until first save attempt
   - Browser UI clearly shows which file

3. **Handle Errors**: Gracefully handle edge cases
   - File deleted/moved → Clear handle
   - Permission revoked → Clear handle
   - IndexedDB unavailable → Skip restoration

### User Experience Flow

**Scenario 1: Happy Path (Permission Granted)**

```
User opens file → Draws → Reloads page
  ↓
Page loads → Restores elements from localStorage
  ↓
Checks IndexedDB → Finds file handle
  ↓
Queries permission → "granted"
  ↓
Restores file handle → "Save to current file" appears
  ↓
Tab title shows filename → User continues working
```

**Scenario 2: Permission Required**

```
User opens file → Draws → Reloads page
  ↓
Page loads → Restores elements from localStorage
  ↓
Checks IndexedDB → Finds file handle
  ↓
Queries permission → "prompt"
  ↓
Browser shows: "Excalidraw wants to edit 'my-drawing.excalidraw'"
  ↓
User clicks "Allow" → File handle restored
```

**Scenario 3: Permission Denied or File Deleted**

```
User opens file → Draws → Reloads page
  ↓
Page loads → Restores elements from localStorage
  ↓
Checks IndexedDB → Finds file handle
  ↓
Queries permission → "denied" OR file doesn't exist
  ↓
Clears saved handle → Falls back to "Save As"
  ↓
User experience: Same as current behavior
```

## Implementation Plan

### Phase 1: Core Storage Layer

- [ ] Create `FileHandleStorage` class in `LocalData.ts`
- [ ] Add IndexedDB database initialization
- [ ] Implement `saveHandle()`, `getHandle()`, `clearHandle()` methods
- [ ] Add error handling and fallbacks

### Phase 2: Integration with File Operations

- [ ] Hook into file open operations (in `FileManager.tsx` or `filesystem.ts`)
- [ ] Hook into file save operations
- [ ] Add handle clearing for "New Drawing" action
- [ ] Update relevant action handlers

### Phase 3: Page Load Restoration

- [ ] Add restoration logic to app initialization (`App.tsx`)
- [ ] Implement permission request flow
- [ ] Handle permission denied cases gracefully
- [ ] Add error logging for debugging

### Phase 4: Testing & Polish

- [ ] Test with various permission scenarios
- [ ] Test file deletion/move edge cases
- [ ] Test browser compatibility (Chrome, Edge, Safari)
- [ ] Add telemetry for restoration success/failure rates
- [ ] Update documentation

### Phase 5: User Experience Enhancements

- [ ] Show permission prompt explanation (optional)
- [ ] Add "Reconnect to file" button if permission denied
- [ ] Show notification when file handle restored
- [ ] Add unsaved changes indicator in tab title

## Key Files to Modify

| File | Purpose | Changes |
| --- | --- | --- |
| `excalidraw-app/data/LocalData.ts` | Add FileHandleStorage class | New IndexedDB storage layer |
| `excalidraw-app/App.tsx` | App initialization | Add file handle restoration |
| `excalidraw-app/data/FileManager.tsx` | File operations | Save handle on open/save |
| `packages/excalidraw/actions/actionExport.tsx` | Export actions | Clear handle on new drawing |

## Browser Compatibility

| Browser      | File System Access API | IndexedDB | File Handle Persistence |
| ------------ | ---------------------- | --------- | ----------------------- |
| Chrome 86+   | ✅ Full support        | ✅        | ✅ **Supported**        |
| Edge 86+     | ✅ Full support        | ✅        | ✅ **Supported**        |
| Safari 15.2+ | ⚠️ Limited support     | ✅        | ⚠️ **Partial**          |
| Firefox      | ❌ No support          | ✅        | ❌ **Not supported**    |
| Opera 72+    | ✅ Full support        | ✅        | ✅ **Supported**        |

**Fallback**: Browsers without File System Access API will continue to work as they do now (without file handle persistence).

## Security & Privacy Considerations

1. **User Control**: Browser maintains full control over permissions
2. **Explicit Consent**: User must explicitly grant permission via browser UI
3. **Revocable**: User can revoke permission at any time
4. **No Sensitive Data**: Only the file handle is stored, not file contents
5. **Origin-Scoped**: Handles are only accessible to the same origin
6. **Secure Context**: Requires HTTPS (or localhost for development)

## Benefits

1. ✅ **Seamless Workflow**: Users can reload without losing file connection
2. ✅ **Better UX**: File name persists in tab title
3. ✅ **Fewer Clicks**: No need to reopen file after reload
4. ✅ **Familiar Pattern**: Matches desktop app behavior
5. ✅ **Backward Compatible**: Graceful fallback for unsupported browsers
6. ✅ **Privacy Respecting**: Uses standard browser permission system

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Permission prompt annoys users | Only prompt once per session, cache permission state |
| File deleted/moved causes errors | Catch errors, clear stale handles gracefully |
| IndexedDB quota exceeded | Minimal data stored (one handle), quota unlikely to be an issue |
| Browser compatibility issues | Feature detection, graceful fallback to current behavior |
| Security/privacy concerns | Use standard browser APIs, no custom permission logic |

## Testing Strategy

### Manual Testing

1. **Basic Flow**: Open file → Reload → Verify handle restored
2. **Permission Flow**: Deny permission → Reload → Verify graceful fallback
3. **File Deletion**: Open file → Delete file → Reload → Verify error handling
4. **New Drawing**: Open file → New drawing → Verify handle cleared
5. **Multiple Tabs**: Open different files in tabs → Reload all → Verify each tab has correct handle

### Automated Testing

1. Unit tests for `FileHandleStorage` class
2. Integration tests for file operation hooks
3. Mock File System Access API for testing
4. Test error scenarios (denied permission, missing file, etc.)

### Browser Testing

- Test in Chrome, Edge, Safari, Firefox
- Test with permission prompts enabled/disabled
- Test with file system access disabled
- Test in incognito/private mode

## Alternative Approaches Considered

### 1. Store File Path as String

**Rejected**: Doesn't provide write access, security risk, path might be invalid

### 2. Automatically Reopen File on Load

**Rejected**: Requires file picker interaction, can't be done silently

### 3. Use File System Access API queryPermission Only

**Rejected**: Still need to store handle to query it

### 4. Store in localStorage as Serialized Object

**Rejected**: FileSystemFileHandle cannot be serialized to JSON

## Future Enhancements

1. **Recent Files List**: Store multiple file handles for quick access
2. **Auto-save**: Periodically save to file handle if permission granted
3. **Conflict Resolution**: Detect if file changed on disk since last save
4. **File Watcher**: Monitor file changes (when API supports it)
5. **Cross-Tab Sync**: Sync file handle changes across tabs

## Success Metrics

After implementation, measure:

- % of page reloads that successfully restore file handle
- % of users who grant permission when prompted
- Reduction in "Save As" usage after page reload
- User feedback on improved workflow

## References

- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [FileSystemFileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [browser-fs-access library](https://github.com/GoogleChromeLabs/browser-fs-access)

## Related Documentation

- [FILE_HANDLING_IMPROVEMENTS.md](./FILE_HANDLING_IMPROVEMENTS.md) - Current file handle implementation
- [Session State Analysis](../analysis/SESSION_STATE.md) - App state persistence mechanisms

---

**Next Steps**: Review proposal → Get approval → Begin Phase 1 implementation

**Estimated Effort**: 2-3 days for core implementation + testing

**Priority**: Medium-High (addresses known user pain point)
