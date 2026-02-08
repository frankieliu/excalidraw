# Multiline Math Debug Instructions

I've added debug logging to help diagnose the multiline math issue.

## Steps to test:

1. Make sure the dev server is running on http://localhost:3000
2. Open the browser console (F12 or Cmd+Option+I)
3. Load the test file:
   - Open http://localhost:3000
   - File menu -> Open
   - Navigate to /Users/frankliu/Documents/excalidraw/test-multiline-math.excalidraw

4. Look for console output with `[MULTILINE DEBUG]` prefix

## Or create a new multiline math element:

1. Go to http://localhost:3000
2. Create a new math text element (press 'M' or use the toolbar)
3. Type: $x$
4. Press Enter
5. Type: $y$
6. Press Enter
7. Type: $z$
8. Press Esc or click away
9. Check the console for debug output

## Expected debug output:

You should see:
- Original text with newlines
- The processed text after consumeMathNewlines
- The array of lines
- The markup array (one array per line)
- Metrics for each line
- Rendering positions for each child

## Please share:

1. What do you see visually on the canvas?
2. What does the console output show?
3. Do all three math symbols appear?
4. Are they on separate lines or overlapping?
