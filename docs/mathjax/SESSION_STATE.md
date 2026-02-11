# MathJax Session State

**Last Updated:** 2026-02-08 **Branch:** mathjax-svg-import-rebased **Dev Server:** http://127.0.0.1:3001/

## Current Session Summary

This document captures the current state of the MathJax math subtype implementation, including completed work, pending tasks, and how to resume development.

## Work Completed

### 1. Container Text Rendering Fix

**Status:** ✅ Complete and documented

Fixed three critical issues with math text rendering on containers:

- Missing import for `getBoundTextMaxWidth` in App.tsx
- Text not centered after editing math text on containers
- Text clipping during container resize

**Solution:** Implemented dependency injection pattern to pass custom measurement functions through the call chain.

**Documentation:** `docs/mathjax/CONTAINER_TEXT_RENDERING_FIX.md`

**Key Files Modified:**

- `packages/excalidraw/components/App.tsx` - Added `getMathMeasurementOptions()` helper
- `packages/element/src/textElement.ts` - Added custom function parameters to `handleBindTextResize()`
- `packages/element/src/binding.ts` - Extended `updateBoundElements()` to forward custom functions

### 2. Circular Dependency Solution

**Status:** ✅ Complete and documented

Resolved circular dependency issue when trying to use subtype methods in the element package.

**Solution:** Used dependency injection pattern where higher-level packages (excalidraw) provide behavior to lower-level packages (element) through function parameters.

**Documentation:** `docs/mathjax/CIRCULAR_DEPENDENCY_SOLUTION.md`

### 3. Math Toggle Feature

**Status:** ✅ Complete and documented

Implemented smart toggle functionality for the Math (M) button with three modes:

1. **Direct text selection:** Toggle selected text between math and regular modes
2. **Container selection:** Toggle bound text when container is selected
3. **Creation mode:** Activate math mode for new elements (original behavior)

**Features:**

- Works with multiple selections simultaneously
- Visual feedback (M button highlights when math text selected)
- Dynamic tooltip ("Toggle Math - M" vs "Math - M")
- Automatic text remeasurement and recentering

**Documentation:** `docs/mathjax/MATH_TOGGLE_FEATURE.md`

**Key Files Modified:**

- `packages/excalidraw/components/Subtypes.tsx` - Extended `SubtypeButton` with toggle logic

### 4. Debug Log Cleanup

**Status:** ✅ Complete

Removed all debug console.log statements from:

- `packages/excalidraw/subtypes/mathjax/implementation.tsx`
- `packages/excalidraw/actions/manager.tsx`
- `packages/excalidraw/components/Actions.tsx`
- `packages/excalidraw/components/App.tsx`

## Current State

### Git Status

```
Branch: mathjax-svg-import-rebased
Latest Commit: 3bcffd13 - feat(mathjax): add smart toggle feature for math mode
Status: Pushed to origin
Ahead of upstream/master by 20 commits
```

### Development Server

Running at: http://127.0.0.1:3001/ Started with: `yarn start`

### Modified Files (Uncommitted Changes)

None - all changes committed and pushed

## Key Architecture Decisions

### 1. Dependency Injection Pattern

**Why:** Avoid circular dependencies between `packages/element` and `packages/excalidraw`

**Implementation:**

- Low-level functions (`handleBindTextResize`) accept optional custom function parameters
- High-level code (`App.tsx`) creates and passes custom measurement functions
- Functions are threaded through the call chain via options objects

**Example:**

```typescript
// High level (App.tsx)
private getMathMeasurementOptions = (element) => {
  // Returns { customMeasureFn, customWrapFn } for math text
  // Returns {} for regular text
};

updateBoundElements(element, this.scene, this.getMathMeasurementOptions(element));

// Low level (binding.ts)
export const updateBoundElements = (element, scene, options?) => {
  handleBindTextResize(
    element,
    scene,
    false,
    false,
    options?.customMeasureFn,
    options?.customWrapFn,
  );
};
```

### 2. Toggle Implementation Strategy

**Why:** Single button for both creation and toggling modes provides better UX

**Implementation:**

- Detect if text elements or containers with text are selected
- If selection exists: toggle mode
- If no selection: activate creation mode
- Visual feedback through button highlight state

## Testing Recommendations

### Toggle Feature Testing

1. **Direct text toggle:**

   - Create text → Select → Click M → Should convert to math
   - Click M again → Should convert back

2. **Container toggle:**

   - Create rectangle with text → Select rectangle → Click M
   - Text should convert to math and stay centered
   - Click M again → Should convert back

3. **Multiple selection:**

   - Select multiple text elements → Click M → All should toggle
   - Select multiple containers → Click M → All bound text should toggle

4. **Visual feedback:**
   - M button highlights when math text selected
   - M button highlights when container with math text selected
   - Tooltip shows "Toggle Math - M" when selection active

### Container Rendering Testing

1. Create rectangle in math mode → Add text → Should render correctly
2. Edit math text on container → Should stay centered after editing
3. Resize container with math text → Text should rewrap and stay visible

## Known Issues and Limitations

### Type Errors (Pre-existing)

The codebase has pre-existing TypeScript type errors in test files:

- `excalidraw-app/tests/collab.test.tsx` - Type incompatibilities
- These are unrelated to the MathJax implementation
- Running `yarn test:typecheck` will show these errors

### Performance Considerations

- Math rendering uses MathJax SVG which is heavier than regular text
- Multiple math elements may impact render performance
- Consider implementing virtualization for large numbers of math elements

## How to Resume Development

### 1. Start Development Server

```bash
cd /Users/frankliu/Projects/excalidraw
yarn start
# Opens at http://127.0.0.1:3001/
```

### 2. Check Current Branch

```bash
git status
git log --oneline -5
```

### 3. Review Documentation

Read these files to understand the implementation:

- `docs/mathjax/MATH_TOGGLE_FEATURE.md` - Toggle feature details
- `docs/mathjax/CONTAINER_TEXT_RENDERING_FIX.md` - Container rendering
- `docs/mathjax/CIRCULAR_DEPENDENCY_SOLUTION.md` - Architecture pattern

### 4. Key Files to Know

**Math Implementation:**

- `packages/excalidraw/subtypes/mathjax/implementation.tsx` - Core math rendering logic
- `packages/excalidraw/subtypes/mathjax/manager.tsx` - MathJax manager

**UI Components:**

- `packages/excalidraw/components/Subtypes.tsx` - M button and toggle logic
- `packages/excalidraw/components/App.tsx` - Main app, text editing, measurement options

**Core Element System:**

- `packages/element/src/textElement.ts` - Text measurement and wrapping
- `packages/element/src/binding.ts` - Container-text binding logic

### 5. Running Tests

```bash
# Type checking
yarn test:typecheck

# Run all tests with snapshot updates
yarn test:update

# Auto-fix formatting and linting
yarn fix
```

## Potential Future Enhancements

### Short Term

1. **Keyboard shortcut:** Add Cmd/Ctrl+M to toggle math mode
2. **Multi-line formulas:** Better handling of line breaks in math mode
3. **Math preview:** Show preview while typing math formulas

### Medium Term

1. **Math library selector:** Allow choosing between MathJax and KaTeX
2. **Inline math mode:** Support mixing math and regular text in same element
3. **Math symbol palette:** UI for inserting common math symbols

### Long Term

1. **Math search:** Search for formulas by their LaTeX source
2. **Math export:** Special handling for math when exporting to different formats
3. **Collaborative math editing:** Real-time collaboration on math formulas

## Debugging Tips

### Math Not Rendering

1. Check browser console for MathJax errors
2. Verify `element.subtype === "math"`
3. Check if `customData` is properly set
4. Verify MathJax library loaded (check network tab)

### Text Not Centered After Editing

1. Verify `redrawTextBoundingBox` is being called
2. Check if custom measurement functions are passed
3. Verify container reference is correct
4. Check if `getBoundTextElement` returns the text element

### Toggle Not Working

1. Check if text/container is actually selected (check `appState.selectedElementIds`)
2. Verify `isTextElement` or `hasBoundTextElement` returns true
3. Check console for errors in `SubtypeButton.perform`
4. Verify `getSubtypeMethods` returns measurement functions

### Performance Issues

1. Check number of math elements being rendered
2. Use browser performance profiler
3. Consider limiting concurrent MathJax rendering
4. Check if elements are being re-rendered unnecessarily

## Contact and Resources

**Project:** Excalidraw **Repository:** https://github.com/excalidraw/excalidraw **MathJax Docs:** https://docs.mathjax.org/ **Branch:** mathjax-svg-import-rebased

## Session Restore Checklist

When resuming this session:

- [ ] Checkout branch: `git checkout mathjax-svg-import-rebased`
- [ ] Pull latest changes: `git pull origin mathjax-svg-import-rebased`
- [ ] Start dev server: `yarn start`
- [ ] Review this document and related docs
- [ ] Test current functionality in browser
- [ ] Check for any new issues or merge conflicts
