# Debugging Math Only Control

I've added debug logging to help diagnose why the Math Only control isn't appearing.

## Steps to Debug

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Refresh the page** to see initial logs
3. **Create or select a math text element**
4. **Look for console output with `[MATH DEBUG]` prefix**

## Expected Console Output

### On Page Load:

```
[MATH DEBUG] Creating math actions - changeMathOnly: custom:changeMathOnly
```

This confirms the action is being created.

### When You Select a Math Element:

```
[MATH DEBUG] changeMathOnly predicate: true selected math elements: 1
```

- `predicate: true` = action should be enabled/visible
- `predicate: false` = action is hidden (element not recognized as math)
- `selected math elements: X` = number of math elements selected

### When the Properties Panel Renders:

```
[MATH DEBUG] changeMathOnly PanelComponent rendering
```

This confirms the UI component is being rendered.

## Common Issues

### If you DON'T see the predicate log when selecting a math element:

- The action predicate isn't being checked (action not registered?)
- Selection isn't working

### If predicate shows `false`:

- Element is not being recognized as a math element
- Check: Does the element have `subtype: "math"`?
- Check: Does it have `customData.useTex` set?

### If predicate shows `true` but no PanelComponent log:

- The panel isn't rendering even though the action is enabled
- There might be an error in the component (check console for React errors)

### If PanelComponent log appears but you don't see the UI:

- The component is rendering but not visible
- Check for CSS/layout issues

## How to Check if an Element is a Math Element

In the console, run:

```javascript
// Get the currently selected element
const app = document.querySelector(".excalidraw")?.excalidrawAPI;
const selected = app?.getAppState()?.selectedElementIds;
const element = Object.keys(selected || {})[0];
const el = app?.getSceneElements().find((e) => e.id === element);
console.log("Selected element:", el);
console.log("Subtype:", el?.subtype);
console.log("CustomData:", el?.customData);
```

Expected output for a math element:

```
Selected element: {type: "text", subtype: "math", ...}
Subtype: "math"
CustomData: {useTex: true, mathOnly: false}
```

## Please Share

1. What do you see in the console when you select a math element?
2. Does the predicate return true or false?
3. Are there any errors?
