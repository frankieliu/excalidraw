# Math Elements: Backward Compatibility

## Overview

This document explains how math elements are stored in Excalidraw files and their compatibility with vanilla Excalidraw (versions without math support).

**TL;DR**: Files with math elements are **fully backward compatible** with vanilla Excalidraw. Users without math support can view, edit, and save these files - they just see raw notation instead of rendered math.

## What Makes a Math Element Different

A math element is a regular text element (`type: "text"`) with two additional **optional** fields:

### Math Element Structure

```json
{
  "type": "text",
  "id": "element-123",
  "text": "E = mc^2",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 50,
  "fontSize": 20,
  "fontFamily": 1,
  "strokeColor": "#000000",
  // ... all other standard text element properties ...

  // Math-specific additions (optional):
  "subtype": "math",
  "customData": {
    "useTex": true,       // true = TeX/LaTeX notation, false = AsciiMath
    "mathOnly": false     // true = entire text is math, false = mixed text/math
  }
}
```

### Regular Text Element (for comparison)

```json
{
  "type": "text",
  "id": "element-456",
  "text": "E = mc^2",
  "x": 100,
  "y": 200,
  // ... all standard properties ...
  // No subtype or customData fields
}
```

### Field Details

**`subtype: "math"`**
- Marks this text element as a math element
- Tells Excalidraw to use math rendering instead of plain text
- Optional field - absence means regular text element

**`customData.useTex`** (boolean)
- `true`: Use TeX/LaTeX notation (delimiters: `$...$` or `\(...\)`)
- `false`: Use AsciiMath notation (delimiters: `` `...` ``)
- Default: `true`

**`customData.mathOnly`** (boolean)
- `true`: Entire text is treated as math (no delimiters needed)
- `false`: Mixed mode - text with inline math delimiters
- Default: `false`

## Backward Compatibility Behavior

### Opening Math Files in Vanilla Excalidraw

When you open a file with math elements in vanilla Excalidraw (without math support):

#### 1. **Fields are Preserved**

Excalidraw's restoration logic preserves unknown fields for forward compatibility:

```typescript
// From packages/excalidraw/data/restore.ts
const ret = {
  // spread the original element properties to not lose unknown ones
  // for forward-compatibility
  ...element,
  // normalized properties
  ...base,
  ...extra,
};
```

The `subtype` and `customData` fields remain in the element structure.

#### 2. **Element Renders as Plain Text**

- Vanilla Excalidraw sees `type: "text"` and renders it as a text element
- The `subtype: "math"` field is **ignored** (no handler registered)
- Text content displays as-is, **without math rendering**
- All standard text properties work normally:
  - Font size, color, alignment
  - Position, rotation, opacity
  - Editing, moving, resizing
  - Grouping, locking, etc.

#### 3. **No Data Loss on Round-Trip**

- When saving from vanilla Excalidraw, `subtype` and `customData` are **preserved**
- Re-opening in Excalidraw with math support **restores math rendering**
- No manual intervention needed

#### 4. **What Users See**

In vanilla Excalidraw, math notation displays as literal text:

| Math Notation | Displays As | Rendered With Math Support |
|---------------|-------------|----------------------------|
| `$E = mc^2$` | `$E = mc^2$` (with dollar signs) | E = mc² (rendered formula) |
| `$\alpha + \beta$` | `$\alpha + \beta$` (literal) | α + β (Greek letters) |
| `` `sqrt(2)` `` | `` `sqrt(2)` `` (with backticks) | √2 (square root symbol) |
| `\(\frac{1}{2}\)` | `\(\frac{1}{2}\)` (with delimiters) | ½ (fraction) |

**Note**: Bounding box dimensions are preserved from when the file was saved with math support, so text may appear to have extra space around it.

## Example Scenarios

### Scenario 1: Pure Math Content

**File saved with math support:**
```json
{
  "type": "text",
  "text": "$\\alpha + \\beta = \\gamma$",
  "fontSize": 20,
  "subtype": "math",
  "customData": { "useTex": true, "mathOnly": false }
}
```

**In vanilla Excalidraw:**
- Displays: `$\alpha + \beta = \gamma$` (literal text with dollar signs)
- User can edit, change font size, move, etc.
- Changes are saved with `subtype` and `customData` intact

**Re-opened with math support:**
- Displays: α + β = γ (beautifully rendered math)
- All edits preserved

### Scenario 2: Mixed Text and Math

**File saved with math support:**
```json
{
  "type": "text",
  "text": "The formula is $E = mc^2$ where E is energy",
  "subtype": "math",
  "customData": { "useTex": true, "mathOnly": false }
}
```

**In vanilla Excalidraw:**
- Displays: `The formula is $E = mc^2$ where E is energy`
- Dollar signs visible around math portion

**With math support:**
- Displays: The formula is E = mc² where E is energy
- Math portion rendered, text portions normal

### Scenario 3: Math-Only Mode

**File saved with math support:**
```json
{
  "type": "text",
  "text": "x^2 + y^2 = r^2",
  "subtype": "math",
  "customData": { "useTex": true, "mathOnly": true }
}
```

**In vanilla Excalidraw:**
- Displays: `x^2 + y^2 = r^2` (plain text, no delimiters)

**With math support:**
- Displays: x² + y² = r² (entire text rendered as math)

## Design Philosophy

Excalidraw follows a **forward-compatibility** design principle:

### Preservation of Unknown Fields

From `packages/excalidraw/data/restore.ts:240-242`:
```typescript
const restoreElementWithProperties = <
  T extends Required<Omit<ExcalidrawElement, "customData" | "subtype">> & {
    customData?: ExcalidrawElement["customData"];
    subtype?: ExcalidrawElement["subtype"];
    // ...
  }
```

Both `customData` and `subtype` are explicitly marked as **optional** in the type system, and unknown fields are preserved during restoration.

### Fields That Are Removed

Only explicitly deprecated fields are stripped:
```typescript
// strip legacy props (migrated in previous steps)
delete ret.strokeSharpness;
delete ret.boundElementIds;
```

This allows:
- ✅ Gradual feature rollout without breaking existing files
- ✅ Experimental features that can be gracefully ignored
- ✅ Custom forks with additional element properties
- ✅ Future enhancements without file format versioning

## Testing Backward Compatibility

### Manual Testing Steps

1. **Create a test file with math elements:**
   - Open Excalidraw with math support
   - Create several text elements with math notation
   - Use different math modes (TeX, AsciiMath, mathOnly)
   - Save the file as `.excalidraw`

2. **Open in vanilla Excalidraw:**
   - Use official Excalidraw (excalidraw.com)
   - Or use an older version without math support
   - Verify all elements are visible (as plain text)
   - Edit text, move elements, change colors
   - Save the file

3. **Re-open with math support:**
   - Verify math rendering returns
   - Check that edits from step 2 are preserved
   - Confirm no data loss

### Automated Testing

Check the test suite in:
- `packages/excalidraw/subtypes/mathjax/tests/implementation.test.tsx`

## Edge Cases and Considerations

### Font Family Override

Math elements use **Helvetica** font family regardless of the user-selected font:
```typescript
const FONT_FAMILY_MATH = FONT_FAMILY.Helvetica;
```

In vanilla Excalidraw, the font family value in the file is preserved, but may look different because math rendering isn't applied.

### Bounding Box Sizing

Math elements may have dimensions calculated based on rendered math:
- In vanilla Excalidraw, the bounding box size is preserved
- Text may appear smaller than the box because it's not rendered as math
- This is expected behavior and doesn't cause issues

### Line Height

Math rendering may use different line heights:
```typescript
(updates as any).lineHeight = getLineHeight(FONT_FAMILY_MATH);
```

The line height is saved in the file and preserved in vanilla Excalidraw.

## Recommendations

### For Users

- **Save your work**: Math files work in both vanilla and math-enabled Excalidraw
- **Collaborate freely**: Share files with users who don't have math support
- **No special actions needed**: Just save and share normally

### For Developers

- **Preserve optional fields**: Follow Excalidraw's pattern of preserving unknown fields
- **Test backward compatibility**: Always test new features in vanilla Excalidraw
- **Document field meanings**: Use `customData` for feature-specific metadata
- **Use optional subtyping**: The `subtype` field enables polymorphic behavior without breaking base functionality

## Related Documentation

- **MATH_SETUP.md** - Setup guide for math features
- **MATH_FONT_SIZE_FIX.md** - Recent fixes for font size and editing
- **MATHJAX_PATCHES_SUMMARY.md** - MathJax patch documentation
- **MATHJAX_INTEGRATION_STATUS.md** - Current integration status

## Summary

✅ **Math elements are fully backward compatible with vanilla Excalidraw**

- Math notation displays as plain text without math support
- All fields are preserved during save/load cycles
- Users can edit, move, and modify elements normally
- Re-opening with math support restores math rendering
- No data loss, no corruption, no special handling needed

The implementation follows Excalidraw's design philosophy of forward compatibility, ensuring that files can be safely shared between different versions and forks of Excalidraw.

---

**Last Updated**: 2026-02-07
**Excalidraw Version**: Fork with MathJax integration
**Math Subtype Version**: Initial
