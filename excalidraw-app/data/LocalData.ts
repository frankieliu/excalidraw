/**
 * This file deals with saving data state (appState, elements, images, ...)
 * locally to the browser.
 *
 * Notes:
 *
 * - DataState refers to full state of the app: appState, elements, images,
 *   though some state is saved separately (collab username, library) for one
 *   reason or another. We also save different data to different storage
 *   (localStorage, indexedDB).
 */

import { clearAppStateForLocalStorage } from "@excalidraw/excalidraw/appState";
import {
  CANVAS_SEARCH_TAB,
  DEFAULT_SIDEBAR,
  debounce,
} from "@excalidraw/common";
import {
  createStore,
  entries,
  del,
  getMany,
  set,
  setMany,
  get,
} from "idb-keyval";

import { appJotaiStore, atom } from "excalidraw-app/app-jotai";
import { getNonDeletedElements } from "@excalidraw/element";

import type { LibraryPersistedData } from "@excalidraw/excalidraw/data/library";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type { ExcalidrawElement, FileId } from "@excalidraw/element/types";
import type {
  AppState,
  BinaryFileData,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { MaybePromise } from "@excalidraw/common/utility-types";

import { SAVE_TO_LOCAL_STORAGE_TIMEOUT, STORAGE_KEYS } from "../app_constants";

import { FileManager } from "./FileManager";
import { Locker } from "./Locker";
import { updateBrowserStateVersion } from "./tabSync";

const filesStore = createStore("files-db", "files-store");
const fileHandleStore = createStore(
  "excalidraw-filehandles-db",
  "handles-store",
);

export const localStorageQuotaExceededAtom = atom(false);

class LocalFileManager extends FileManager {
  clearObsoleteFiles = async (opts: { currentFileIds: FileId[] }) => {
    await entries(filesStore).then((entries) => {
      for (const [id, imageData] of entries as [FileId, BinaryFileData][]) {
        // if image is unused (not on canvas) & is older than 1 day, delete it
        // from storage. We check `lastRetrieved` we care about the last time
        // the image was used (loaded on canvas), not when it was initially
        // created.
        if (
          (!imageData.lastRetrieved ||
            Date.now() - imageData.lastRetrieved > 24 * 3600 * 1000) &&
          !opts.currentFileIds.includes(id as FileId)
        ) {
          del(id, filesStore);
        }
      }
    });
  };
}

const saveDataStateToLocalStorage = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const localStorageQuotaExceeded = appJotaiStore.get(
    localStorageQuotaExceededAtom,
  );
  try {
    const _appState = clearAppStateForLocalStorage(appState);

    if (
      _appState.openSidebar?.name === DEFAULT_SIDEBAR.name &&
      _appState.openSidebar.tab === CANVAS_SEARCH_TAB
    ) {
      _appState.openSidebar = null;
    }

    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS,
      JSON.stringify(getNonDeletedElements(elements)),
    );
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_APP_STATE,
      JSON.stringify(_appState),
    );
    updateBrowserStateVersion(STORAGE_KEYS.VERSION_DATA_STATE);
    if (localStorageQuotaExceeded) {
      appJotaiStore.set(localStorageQuotaExceededAtom, false);
    }
  } catch (error: any) {
    // Unable to access window.localStorage
    console.error(error);
    if (isQuotaExceededError(error) && !localStorageQuotaExceeded) {
      appJotaiStore.set(localStorageQuotaExceededAtom, true);
    }
  }
};

const isQuotaExceededError = (error: any) => {
  return error instanceof DOMException && error.name === "QuotaExceededError";
};

type SavingLockTypes = "collaboration";

export class LocalData {
  private static _save = debounce(
    async (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
      onFilesSaved: () => void,
    ) => {
      saveDataStateToLocalStorage(elements, appState);

      await this.fileStorage.saveFiles({
        elements,
        files,
      });
      onFilesSaved();
    },
    SAVE_TO_LOCAL_STORAGE_TIMEOUT,
  );

  /** Saves DataState, including files. Bails if saving is paused */
  static save = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
    onFilesSaved: () => void,
  ) => {
    // we need to make the `isSavePaused` check synchronously (undebounced)
    if (!this.isSavePaused()) {
      this._save(elements, appState, files, onFilesSaved);
    }
  };

  static flushSave = () => {
    this._save.flush();
  };

  private static locker = new Locker<SavingLockTypes>();

  static pauseSave = (lockType: SavingLockTypes) => {
    this.locker.lock(lockType);
  };

  static resumeSave = (lockType: SavingLockTypes) => {
    this.locker.unlock(lockType);
  };

  static isSavePaused = () => {
    return document.hidden || this.locker.isLocked();
  };

  // ---------------------------------------------------------------------------

  static fileStorage = new LocalFileManager({
    getFiles(ids) {
      return getMany(ids, filesStore).then(
        async (filesData: (BinaryFileData | undefined)[]) => {
          const loadedFiles: BinaryFileData[] = [];
          const erroredFiles = new Map<FileId, true>();

          const filesToSave: [FileId, BinaryFileData][] = [];

          filesData.forEach((data, index) => {
            const id = ids[index];
            if (data) {
              const _data: BinaryFileData = {
                ...data,
                lastRetrieved: Date.now(),
              };
              filesToSave.push([id, _data]);
              loadedFiles.push(_data);
            } else {
              erroredFiles.set(id, true);
            }
          });

          try {
            // save loaded files back to storage with updated `lastRetrieved`
            setMany(filesToSave, filesStore);
          } catch (error) {
            console.warn(error);
          }

          return { loadedFiles, erroredFiles };
        },
      );
    },
    async saveFiles({ addedFiles }) {
      const savedFiles = new Map<FileId, BinaryFileData>();
      const erroredFiles = new Map<FileId, BinaryFileData>();

      // before we use `storage` event synchronization, let's update the flag
      // optimistically. Hopefully nothing fails, and an IDB read executed
      // before an IDB write finishes will read the latest value.
      updateBrowserStateVersion(STORAGE_KEYS.VERSION_FILES);

      await Promise.all(
        [...addedFiles].map(async ([id, fileData]) => {
          try {
            await set(id, fileData, filesStore);
            savedFiles.set(id, fileData);
          } catch (error: any) {
            console.error(error);
            erroredFiles.set(id, fileData);
          }
        }),
      );

      return { savedFiles, erroredFiles };
    },
  });
}
export class LibraryIndexedDBAdapter {
  /** IndexedDB database and store name */
  private static idb_name = STORAGE_KEYS.IDB_LIBRARY;
  /** library data store key */
  private static key = "libraryData";

  private static store = createStore(
    `${LibraryIndexedDBAdapter.idb_name}-db`,
    `${LibraryIndexedDBAdapter.idb_name}-store`,
  );

  static async load() {
    const IDBData = await get<LibraryPersistedData>(
      LibraryIndexedDBAdapter.key,
      LibraryIndexedDBAdapter.store,
    );

    return IDBData || null;
  }

  static save(data: LibraryPersistedData): MaybePromise<void> {
    return set(
      LibraryIndexedDBAdapter.key,
      data,
      LibraryIndexedDBAdapter.store,
    );
  }
}

/** LS Adapter used only for migrating LS library data
 * to indexedDB */
export class LibraryLocalStorageMigrationAdapter {
  static load() {
    const LSData = localStorage.getItem(
      STORAGE_KEYS.__LEGACY_LOCAL_STORAGE_LIBRARY,
    );
    if (LSData != null) {
      const libraryItems: ImportedDataState["libraryItems"] =
        JSON.parse(LSData);
      if (libraryItems) {
        return { libraryItems };
      }
    }
    return null;
  }
  static clear() {
    localStorage.removeItem(STORAGE_KEYS.__LEGACY_LOCAL_STORAGE_LIBRARY);
  }
}

/**
 * File Handle Storage for persisting file handles across page reloads.
 * Uses IndexedDB because FileSystemFileHandle objects cannot be serialized to JSON.
 */
export class FileHandleStorage {
  /** IndexedDB store key for current file handle */
  private static readonly CURRENT_FILE_KEY = "current-file";

  /**
   * Save a file handle to IndexedDB along with metadata
   * @param handle - The FileSystemFileHandle to persist
   * @returns Promise that resolves when saved
   */
  static async saveHandle(
    handle: FileSystemFileHandle,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Store handle with metadata for better UX
      const entry = {
        handle,
        savedAt: Date.now(),
        fileName: handle.name,
      };
      await set(FileHandleStorage.CURRENT_FILE_KEY, entry, fileHandleStore);
      return { success: true };
    } catch (error) {
      console.error("Failed to save file handle:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Retrieve the saved file handle from IndexedDB
   * @returns Promise that resolves to the FileSystemFileHandle or null
   */
  static async getHandle(): Promise<{
    handle: FileSystemFileHandle | null;
    fileName?: string;
    savedAt?: number;
  }> {
    try {
      const entry = await get<{
        handle: FileSystemFileHandle;
        fileName: string;
        savedAt: number;
      }>(FileHandleStorage.CURRENT_FILE_KEY, fileHandleStore);

      if (!entry) {
        return { handle: null };
      }

      return {
        handle: entry.handle,
        fileName: entry.fileName,
        savedAt: entry.savedAt,
      };
    } catch (error) {
      console.warn("Failed to retrieve file handle:", error);
      return { handle: null };
    }
  }

  /**
   * Clear the saved file handle from IndexedDB
   * @returns Promise that resolves when cleared
   */
  static async clearHandle(): Promise<void> {
    try {
      await del(FileHandleStorage.CURRENT_FILE_KEY, fileHandleStore);
    } catch (error) {
      console.warn("Failed to clear file handle:", error);
    }
  }

  /**
   * Verify if the stored file handle is still valid
   * NOTE: Only queries permission, does not request it (requires user activation)
   * @param handle - The FileSystemFileHandle to verify
   * @param requestIfNeeded - If true, will request permission (requires user gesture)
   * @returns Promise that resolves to the permission status
   */
  static async verifyHandlePermission(
    handle: FileSystemFileHandle,
    requestIfNeeded = false,
  ): Promise<{
    granted: boolean;
    permission: PermissionState;
    error?: Error;
  }> {
    try {
      // Type assertion needed because permission methods aren't in standard TS lib yet
      // These methods are part of the File System Access API specification
      const handleWithPermissions = handle as FileSystemFileHandle & {
        queryPermission(descriptor?: {
          mode?: "read" | "readwrite";
        }): Promise<PermissionState>;
        requestPermission(descriptor?: {
          mode?: "read" | "readwrite";
        }): Promise<PermissionState>;
      };

      // Check current permission status
      const permission = await handleWithPermissions.queryPermission({
        mode: "readwrite",
      });

      if (permission === "granted") {
        return { granted: true, permission };
      }

      // Only request permission if explicitly requested AND permission is "prompt"
      // This requires user activation (must be called in response to user gesture)
      if (requestIfNeeded && permission === "prompt") {
        try {
          const newPermission = await handleWithPermissions.requestPermission({
            mode: "readwrite",
          });
          return {
            granted: newPermission === "granted",
            permission: newPermission,
          };
        } catch (error) {
          // Request failed (likely no user activation)
          console.warn("Permission request failed:", error);
          return { granted: false, permission: "prompt" };
        }
      }

      // Permission is either "denied" or "prompt" (and we're not requesting)
      return { granted: false, permission };
    } catch (error) {
      console.error("Failed to verify file handle permission:", error);
      return {
        granted: false,
        permission: "denied",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Restore file handle from storage and verify permissions
   * Only restores handles with "granted" permission on page load
   * Keeps handle in storage if permission is "prompt" for later restoration
   * @returns Promise that resolves to verified handle or null
   */
  static async restoreHandle(): Promise<{
    handle: FileSystemFileHandle | null;
    granted: boolean;
    fileName?: string;
    needsPermission: boolean;
  }> {
    const { handle, fileName } = await FileHandleStorage.getHandle();

    if (!handle) {
      return { handle: null, granted: false, needsPermission: false };
    }

    // Only query permission, don't request (page load = no user activation)
    const verification =
      await FileHandleStorage.verifyHandlePermission(handle, false);

    if (verification.permission === "granted") {
      // Permission already granted - can use the handle
      return { handle, granted: true, fileName, needsPermission: false };
    }

    if (verification.permission === "denied") {
      // Permission explicitly denied - clear stale handle
      await FileHandleStorage.clearHandle();
      return { handle: null, granted: false, needsPermission: false };
    }

    // Permission is "prompt" - keep handle for later restoration
    // Return info so UI can show a restore button
    console.info(
      `File handle for "${fileName}" needs permission. User can restore with a click.`,
    );
    return { handle, granted: false, fileName, needsPermission: true };
  }

  /**
   * Request permission and restore a file handle (requires user activation)
   * Call this in response to a user click/interaction
   * @param handle - The file handle to restore
   * @returns Promise that resolves when permission is granted or denied
   */
  static async restoreHandleWithPermission(
    handle: FileSystemFileHandle,
  ): Promise<{ granted: boolean; error?: Error }> {
    // This will request permission (requires user activation)
    const verification =
      await FileHandleStorage.verifyHandlePermission(handle, true);

    if (verification.granted) {
      console.info("File handle permission granted");
      return { granted: true };
    }

    if (verification.permission === "denied") {
      // User denied - clear the handle
      await FileHandleStorage.clearHandle();
      return {
        granted: false,
        error: new Error("Permission denied by user"),
      };
    }

    return {
      granted: false,
      error: verification.error || new Error("Failed to get permission"),
    };
  }
}
