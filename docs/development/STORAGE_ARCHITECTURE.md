# Storage Architecture in Excalidraw

This document explains how Excalidraw uses browser storage APIs to persist data.

## localStorage vs IndexedDB

| Feature | localStorage | IndexedDB |
|---------|--------------|-----------|
| **Storage limit** | ~5-10 MB | ~50% of disk space (GBs) |
| **Data format** | Strings only | Any JS objects, blobs, files |
| **API** | Synchronous (blocking) | Asynchronous (non-blocking) |
| **Structure** | Simple key-value | Database with tables/indexes |
| **Querying** | Get by key only | Indexes, ranges, cursors |

## How Excalidraw Uses Each

### localStorage

Used for small, frequently accessed JSON data:

```javascript
// Saving
localStorage.setItem("excalidraw", JSON.stringify(elements));
localStorage.setItem("excalidraw-state", JSON.stringify(appState));

// Loading
const elements = JSON.parse(localStorage.getItem("excalidraw"));
```

**Advantages:**
- Fast for small JSON data
- Simple synchronous API
- Good for settings and small state

**Limitations:**
- Only stores strings (must JSON.stringify)
- Blocks the main thread during read/write
- Limited storage (~5-10 MB)

### IndexedDB

Used for large data and non-serializable objects:

```javascript
// Using idb-keyval library
import { set, get } from "idb-keyval";

// Saving
await set("current-file", { handle, fileName }, fileHandleStore);

// Loading
const data = await get("current-file", fileHandleStore);
```

**Advantages:**
- Can store `FileSystemFileHandle` objects (not JSON-serializable)
- Can store large binary files (images)
- Asynchronous - won't block the UI
- Much larger storage limits

**Limitations:**
- More complex API
- Requires async/await handling

## Data Storage Map

| Data Type | Storage | Key/Store | Why |
|-----------|---------|-----------|-----|
| Canvas elements | localStorage | `excalidraw` | Small JSON, quick sync access |
| App state (theme, name, etc.) | localStorage | `excalidraw-state` | Small JSON, quick sync access |
| Image/binary files | IndexedDB | `files-db` / `files-store` | Large binary blobs |
| File handles | IndexedDB | `excalidraw-filehandles-db` / `handles-store` | Can't serialize to JSON |
| Library items | IndexedDB | `excalidraw-library` | Can be large, async is fine |

## Key Files

- **`excalidraw-app/data/LocalData.ts`** - Main storage implementation
  - `LocalData` class - Handles saving elements and app state
  - `LocalFileManager` class - Handles image file storage
  - `FileHandleStorage` class - Handles file handle persistence
  - `LibraryIndexedDBAdapter` class - Handles library storage

- **`excalidraw-app/app_constants.ts`** - Storage key constants
  ```typescript
  STORAGE_KEYS = {
    LOCAL_STORAGE_ELEMENTS: "excalidraw",
    LOCAL_STORAGE_APP_STATE: "excalidraw-state",
    // ...
  }
  ```

## Why File Handles Need IndexedDB

`FileSystemFileHandle` objects (from the File System Access API) cannot be stored in localStorage because:

1. They are complex objects with methods (`getFile()`, `createWritable()`)
2. They contain internal browser references
3. `JSON.stringify()` cannot serialize them

IndexedDB uses the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) which can handle these objects.

## Debugging Storage

### Check localStorage:
```javascript
// In browser console
console.log(localStorage.getItem("excalidraw"));
console.log(localStorage.getItem("excalidraw-state"));
```

### Check IndexedDB (file handles):
```javascript
// In browser console
const request = indexedDB.open('excalidraw-filehandles-db', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('handles-store', 'readonly');
  const store = tx.objectStore('handles-store');
  const getRequest = store.get('current-file');
  getRequest.onsuccess = () => {
    console.log('Stored file handle data:', getRequest.result);
  };
};
```

### Check IndexedDB (image files):
```javascript
// In browser console
const request = indexedDB.open('files-db', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('files-store', 'readonly');
  const store = tx.objectStore('files-store');
  store.getAllKeys().onsuccess = (e) => {
    console.log('Stored file IDs:', e.target.result);
  };
};
```

## Related Documentation

- [File Handle Persistence](../ui-improvements/FILE_HANDLE_PERSISTENCE.md) - How file handles are persisted across reloads
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
