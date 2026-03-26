# Upstream Merge Conflict Resolution Guide

How the merge of `upstream/master` into `mathjax-svg-import-rebased` was resolved (March 2026, 40 upstream commits).

## Merge Setup

The merge was performed in an isolated clone at `~/Projects/excalidraw-merge` to avoid disrupting the main working directory:

```bash
git clone /Users/frankliu/Projects/excalidraw ~/Projects/excalidraw-merge
cd ~/Projects/excalidraw-merge
git remote add upstream git@github.com:excalidraw/excalidraw.git
git fetch upstream master
git merge upstream/master
```

## Conflict Details

### 1. `packages/excalidraw/components/App.tsx` (4 conflicts)

**Conflict A — `getMathMeasurementOptions` method area (line ~672)**
- Ours: `getMathMeasurementOptions` method + `handleToastClose`
- Theirs: Removed `handleToastClose` (Toast now handled via LayerUI)
- Resolution: Kept our `getMathMeasurementOptions`, dropped `handleToastClose`

**Conflict B — Constructor API initialization (line ~880)**
- Ours: Inline API object creation in constructor
- Theirs: Refactored to `createExcalidrawAPI()` method
- Resolution: Used upstream's `createExcalidrawAPI()` pattern, added `addSubtype: this.addSubtype` to the API object

**Conflict C — Render section (line ~2390)**
- Ours: Magic frame/iframe/context menu buttons
- Theirs: Same buttons with different indentation/structure
- Resolution: Removed duplicates, used upstream's structure

**Conflict D — Text creation (line ~6548)**
- Ours: `selectSubtype(this.state, "text")` for math mode
- Theirs: New `getTextCreationGridPoint`/`newTextElementPosition` logic
- Resolution: Kept both — our subtype selection + upstream's grid point logic

### 2. `excalidraw-app/App.tsx` (2 conflicts)

**Conflict A — Imports**
- Ours: `useMathSubtype`
- Theirs: `ExcalidrawAPIProvider`, `useExcalidrawAPI`
- Resolution: Included all imports

**Conflict B — Hook usage (line ~440)**
- Ours: `useMathSubtype(excalidrawAPI)` with old `useCallbackRefState` pattern
- Theirs: New `useExcalidrawAPI()` hook
- Resolution: Adapted `useMathSubtype` to use `useExcalidrawAPI()`:
  ```tsx
  const excalidrawAPI = useExcalidrawAPI();
  useMathSubtype(excalidrawAPI);
  ```

### 3. `packages/excalidraw/actions/actionTextAutoResize.ts` (1 conflict)

- Ours: `redrawTextBoundingBox` import
- Theirs: `isExcalidrawElement` import
- Resolution: Included both imports

### 4. `packages/excalidraw/index.tsx` (1 conflict)

- Ours: `useMathSubtype` export
- Theirs: New exports (`renderSpreadsheet`, `tryParseSpreadsheet`, `useExcalidrawStateValue`, `useOnExcalidrawStateChange`)
- Resolution: Included all exports

### 5. `packages/excalidraw/locales/en.json` (1 conflict)

- Ours: MathJax labels (e.g., `"mathMode"`, `"mathToggle"`)
- Theirs: Preferences labels (e.g., `"autoResize"`, `"arrowBinding"`)
- Resolution: Included all labels

### 6. `packages/excalidraw/types.ts` (1 conflict)

- Ours: `addSubtype` in `ExcalidrawImperativeAPI`
- Theirs: `onStateChange`/`onEvent` in `ExcalidrawImperativeAPI`
- Resolution: Included all API methods

## Post-Merge Fixes

### Stale `charts.ts`

Upstream replaced `packages/excalidraw/charts.ts` with `packages/excalidraw/charts/` directory (radar chart refactor). The merge kept both, causing esbuild to resolve `import ... from "../charts"` to the old file. Fix: deleted `charts.ts`.

### Prettier violation

Extra blank line at `excalidraw-app/App.tsx:442` between `useMathSubtype` call and the next block. Removed.

## Key Upstream API Changes to Watch

| Old Pattern | New Pattern | Impact |
|-------------|-------------|--------|
| `useCallbackRefState<ExcalidrawImperativeAPI>()` | `useExcalidrawAPI()` + `ExcalidrawAPIProvider` | Any code hooking into the API needs updating |
| `charts.ts` (single file) | `charts/` directory with `index.ts` | Import paths unchanged but file layout different |
| Toast in App render | Toast via LayerUI | `handleToastClose` removed from App class |
| `createExcalidrawAPI()` didn't exist | New method on App class | API object creation centralized |
