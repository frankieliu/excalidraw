# Multiline Math Rendering Fix

## Problem Identified

The issue was in the `consumeMathNewlines` function at line 381. The condition:

```typescript
if (i % 2 === 1 || mathProps.mathOnly)
```

This was replacing newlines with spaces in ALL segments when `mathOnly: true`, which prevented multiline math from working.

## The Fix

Changed line 381 from:

```typescript
if (i % 2 === 1 || mathProps.mathOnly) {
```

To:

```typescript
if (i % 2 === 1) {
```

This ensures that:

1. In mixed mode (`mathOnly: false`), newlines between math expressions like `$x$\n$y$\n$z$` are preserved
2. In math-only mode (`mathOnly: true`), newlines in the math content are also preserved, allowing multiline equations
3. Newlines WITHIN individual math segments are still replaced with spaces (to allow breaking long equations across lines in source code)

## Also Changed

- Initial y position from -1 to 0 for better multiline positioning alignment

## Testing

### Test Case 1: Mixed Mode (mathOnly: false)

1. Create a math text element
2. Type: `$x$` (Enter) `$y$` (Enter) `$z$`
3. Expected: Three lines, each with one symbol

### Test Case 2: Math-Only Mode (mathOnly: true)

1. Create a math-only text element
2. Type: `x = 1` (Enter) `y = 2` (Enter) `z = 3`
3. Expected: Three lines of equations

### Test Case 3: Complex Multiline Equation

1. Create a math-only element
2. Type:
   ```
   \begin{align}
   x &= a \\
   y &= b \\
   z &= c
   \end{align}
   ```
3. Expected: Aligned equations on multiple lines

## Debug Logs

The fix includes debug logs with the prefix `[MULTILINE DEBUG]`. Check the browser console to see:

- Original text
- Processed text after consumeMathNewlines
- Split lines
- Markup arrays
- Rendering positions

To remove debug logs later, search for `[MULTILINE DEBUG]` and delete those console.log statements.
