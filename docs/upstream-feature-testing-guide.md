# Upstream Feature Testing Guide

How to test features introduced by the upstream merge into `mathjax-svg-import-rebased`.

## Our Features (MathJax / SVG Import / Custom)

### 1. MathJax rendering
- Create a text element, toggle math mode, type LaTeX (e.g., `$E=mc^2$`)
- Verify it renders as formatted math

### 2. Math mode toggle
- Use the smart toggle to switch between text and math modes on existing elements

### 3. Math in containers
- Add math text inside rectangles/ellipses
- Verify it renders without clipping
- **Resize the container** — text should stay centered correctly (fixed in this session)

### 4. SVG import
- Use the menu to import an SVG file
- Verify it positions correctly on canvas

### 5. Excalidraw file import
- Import a `.excalidraw` file via menu
- Check smart positioning

### 6. Center to Origin action
- Select elements, use Center to Origin
- Verify bound arrows are handled separately

### 7. File handle persistence
- Save a file, reload the page
- Verify it reconnects to the same file handle

### 8. Refresh text bounds
- Use refresh text bounds on clipped text

## Upstream Features

### 9. Charts — Radar chart
- Paste tab-separated spreadsheet data onto the canvas (Cmd+V)
- **Important**: The top-left cell must have content (e.g., "Category"), not be empty
- A dialog should appear with **bar**, **line**, and **radar** chart type options

Sample data (copy from a plain text source or use `pbcopy`):
```
Category	Sales	Marketing	Engineering
Q1	100	80	90
Q2	120	85	95
Q3	110	90	100
Q4	130	95	105
```

**Known gotcha**: Copying from rich text editors (TextEdit, chat apps) may produce `mixedContent` HTML which bypasses the spreadsheet parser. Use `pbcopy` or copy from a code editor.

### 10. Charts — Multiple series
- Same data as above — each column (Sales, Marketing, Engineering) renders as a separate colored series
- Verify in all three chart types: bar (grouped bars), line (multiple lines), radar (overlapping shapes)

### 11. Text auto-resize handle
1. Create a text element with a full sentence
2. Select it, drag a **side handle** (small square on left/right edge) to manually resize — this disables `autoResize`
3. Click away, then re-select the text
4. A faint **vertical line** (16px, semi-transparent, selection color) appears to the right of the text box
5. Click it — the text box snaps back to auto-fit its content

**Conditions for visibility**:
- Desktop only (not mobile)
- Text element must have `autoResize: false`
- Element height must be large enough (handle fits within 80% of height)

**Code**: `packages/excalidraw/textAutoResizeHandle.ts`

### 12. Arrow binding toggle
1. Click the **hamburger menu** (top-left)
2. Open **Preferences** submenu
3. Find **"Arrow Binding"** checkbox
4. Toggle off — arrows no longer snap/bind to shapes
5. Toggle on — normal binding behavior resumes

**Not** a toolbar button or keyboard shortcut — menu only.

**Code**: `packages/excalidraw/actions/actionToggleArrowBinding.tsx`

### 13. Dropdown menu updates
- Open hamburger menu, navigate submenus
- Right-click elements for context menu
- Verify all menus render correctly with proper hover states

Upstream refactored dropdown components: `DropdownMenu.tsx`, `DropdownMenuSub.tsx`, `DropdownMenuSubContent.tsx`, etc.

### 14. Command palette
- Press **Cmd+/** or **Cmd+Shift+P** (not Cmd+K)
- A searchable command palette appears
- Search for actions, tools, settings

**Code**: `packages/excalidraw/components/CommandPalette/CommandPalette.tsx`

## General Regression

### 15. Basic drawing
- Rectangle, ellipse, arrow, line, freedraw all work

### 16. Text editing
- Double-click to edit text, verify font picker works

### 17. Undo/redo
- Make changes, undo, redo

### 18. Export
- Export to PNG/SVG, verify output

### 19. Copy/paste
- Copy elements, paste them
