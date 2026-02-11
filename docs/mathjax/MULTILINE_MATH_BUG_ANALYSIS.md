# Analysis of Multiline Math Issue

## The Bug

In `consumeMathNewlines` (lines 366-383), there's logic that replaces newlines with spaces:

```typescript
if (mathProps.useTex || !mathProps.mathOnly) {
  for (let i = 0; i < tempText.length; i++) {
    if (i % 2 === 1 || mathProps.mathOnly) {
      tempText[i] = tempText[i].replace(/\n/g, " ");
    }
  }
}
```

## Scenarios:

### mathOnly: false (mixed mode) ✅ WORKS

- Text: `$x$\n$y$\n$z$`
- After splitMath: `["", "x", "\n", "y", "\n", "z", ""]`
- Loop replaces newlines only at ODD indices (math segments)
- Newlines at EVEN indices (between math) are PRESERVED
- Result: `\(x\)\n\(y\)\n\(z\)` → 3 lines

### mathOnly: true ❌ BROKEN

- Text: `x\ny\nz` (no delimiters needed)
- After splitMath: `["x\ny\nz"]` (treated as one math segment)
- Loop replaces newlines at ALL indices (because mathOnly=true)
- Result: `x y z` → 1 line with spaces

## The Fix

The condition `if (i % 2 === 1 || mathProps.mathOnly)` is wrong for mathOnly mode with multiline text.

In mathOnly mode, newlines should be preserved (not replaced with spaces) to allow multiline math expressions.

The fix is to change the condition to NEVER replace newlines when we want multiline support, or to handle mathOnly mode differently.

## Question for User

Which mode are you using when creating the multiline math?

- mathOnly: false (need $ delimiters for each expression)
- mathOnly: true (entire text is math, no delimiters needed)
