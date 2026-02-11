# Keyboard Shortcuts Reference

**Date**: 2026-02-09

## Overview

This document lists keyboard shortcuts for custom features added to this Excalidraw fork, as well as corrections to documentation for standard shortcuts.

## Custom Feature Shortcuts

### Text & Math Features

| Action | Windows/Linux | Mac | Description |
| --- | --- | --- | --- |
| Toggle Math Mode | `Ctrl + Shift + M` | `Cmd + Shift + M` | Switch between math-only and mixed text mode (MathJax feature) |

### Import Features

| Action | Windows/Linux | Mac | Description |
| --- | --- | --- | --- |
| Import SVG | `Ctrl + Shift + I` | `Cmd + Shift + I` | Open SVG file import dialog |
| Import Excalidraw | `Ctrl + Shift + X` | `Cmd + Shift + X` | Import Excalidraw file content into current scene |

### UI & Panels

| Action | Windows/Linux | Mac | Description |
| --- | --- | --- | --- |
| Toggle Properties Panel | `Ctrl + /` | `Option + /` | Open/close the Stats/Properties panel on the right side |

**Note**: The Properties panel shortcut on Mac is `Option + /`, not `Cmd + /`.

## Standard Excalidraw Shortcuts

### File Operations

| Action               | Windows/Linux      | Mac               |
| -------------------- | ------------------ | ----------------- |
| Open                 | `Ctrl + O`         | `Cmd + O`         |
| Save to current file | `Ctrl + S`         | `Cmd + S`         |
| Save As              | `Ctrl + Shift + S` | `Cmd + Shift + S` |

### Development

| Action               | Windows/Linux      | Mac               |
| -------------------- | ------------------ | ----------------- |
| Hard refresh browser | `Ctrl + Shift + R` | `Cmd + Shift + R` |

## Shortcut Conflicts

### Known Issues

1. **Stats Panel on Mac**: The standard documentation may incorrectly state `Cmd + /`, but the actual shortcut is `Option + /`

### Avoiding Conflicts

When adding new keyboard shortcuts:

- Check existing shortcuts in `packages/excalidraw/actions/` files
- Avoid conflicts with browser shortcuts (e.g., `Cmd + W`, `Cmd + T`)
- Use Shift modifiers for secondary actions
- Document any platform-specific differences

## Testing Keyboard Shortcuts

### Verify a Shortcut Works

1. Open Excalidraw in your browser
2. Press the keyboard combination
3. Verify the expected action occurs

### Debug Non-Working Shortcuts

1. **Check browser DevTools Console** for errors:

   ```
   Open DevTools: F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows/Linux)
   ```

2. **Check if shortcut is registered**:

   - Look in `packages/excalidraw/actions/` for the action
   - Find `keyTest` function that defines the shortcut
   - Example:
     ```typescript
     keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.O;
     ```

3. **Check for conflicts**:
   - Try in incognito mode (disables extensions)
   - Check if OS or browser is intercepting the shortcut

## Platform-Specific Modifiers

### Modifier Key Mapping

| Modifier  | Windows/Linux | Mac          |
| --------- | ------------- | ------------ |
| Primary   | `Ctrl`        | `Cmd` (⌘)    |
| Secondary | `Alt`         | `Option` (⌥) |
| Tertiary  | `Shift`       | `Shift`      |

### Common Patterns

```typescript
// Cross-platform primary modifier (Ctrl/Cmd)
event[KEYS.CTRL_OR_CMD] && event.key === "S";

// Platform-specific
if (isMac) {
  // Cmd + /
} else {
  // Ctrl + /
}
```

## Adding New Shortcuts

### Step-by-Step Guide

1. **Choose an available shortcut**:

   - Check this document for conflicts
   - Avoid common browser shortcuts

2. **Define in action file**:

   ```typescript
   // packages/excalidraw/actions/actionYourFeature.ts
   export const actionYourFeature = register({
     name: "yourFeature",
     label: "labels.yourFeature",
     // ... other properties
     keyTest: (event) =>
       event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.Y,
   });
   ```

3. **Document the shortcut**:

   - Add to this file
   - Add to feature-specific documentation
   - Update tooltips/help text

4. **Test on all platforms**:
   - Windows
   - macOS
   - Linux

## Shortcut Discovery

### Help Dialog

Users can discover shortcuts via:

1. Press `?` or `Shift + /` to open Help dialog
2. View "Shortcuts" section

### Tooltips

Most toolbar buttons show shortcuts on hover.

## Related Files

| File | Purpose |
| --- | --- |
| `packages/excalidraw/keys.ts` | Keyboard key constants |
| `packages/excalidraw/actions/shortcuts.ts` | Shortcut utilities |
| `packages/excalidraw/actions/*.tsx` | Individual action shortcuts |
| `packages/excalidraw/components/HelpDialog.tsx` | Help dialog with shortcuts |

## Future Improvements

Potential enhancements:

1. **Customizable shortcuts**: Allow users to remap shortcuts
2. **Shortcut cheat sheet**: Overlay showing all shortcuts
3. **Conflict detection**: Warn when shortcuts overlap
4. **Platform auto-detection**: Better handling of Mac vs Windows/Linux
5. **Localized shortcuts**: Support for non-QWERTY keyboards

## References

- [Excalidraw Keyboard Shortcuts](https://docs.excalidraw.com) - Official documentation
- [Browser Keyboard Shortcuts](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) - MDN Web Docs
- Custom feature docs in this repository

---

**Last Updated**: 2026-02-09
