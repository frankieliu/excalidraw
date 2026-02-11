# Obsidian Excalidraw Plugin - Feature Analysis

Analysis of features from the Obsidian Excalidraw plugin that could be useful for the main Excalidraw app.

## SVG Import Feature

### Implementation Location

- **Dialog**: `src/shared/Dialogs/ImportSVGDialog.ts`
- **Core Library**: `src/shared/svgToExcalidraw/`
- **API Method**: `ExcalidrawAutomate.importSVG(svgString)`

### How It Works

```typescript
// From ImportSVGDialog.ts
async onChooseItem(item: TFile, _: KeyboardEvent): Promise<void> {
    const ea = getEA(this.view) as ExcalidrawAutomate;
    const svg = await this.app.vault.read(item);
    ea.importSVG(svg);
    ea.addToGroup(ea.getElements().map(el=>el.id));
    await ea.addElementsToView(true, true, true, true);
    ea.destroy();
}
```

### SVG-to-Excalidraw Library

**Source**: https://github.com/excalidraw/svg-to-excalidraw

- **Note**: This is an official Excalidraw library but hasn't been maintained in over a year
- **Implementation**: Embedded directly into the Obsidian plugin for smaller bundle size

**Key Files**:

- `walker.ts` - Main SVG traversal/parsing
- `parser.ts` - SVG string parsing
- `transform.ts` - Coordinate transformations
- `attributes.ts` - SVG attribute handling
- `elements/` - Converters for different SVG elements (path, rect, circle, etc.)

### Features

- Converts SVG paths, shapes, and text to Excalidraw elements
- Preserves colors, stroke widths, and fill styles
- Groups imported elements automatically
- Handles SVG transformations (translate, rotate, scale)

### Potential Integration Points

1. **File Menu**: Add "Import SVG..." menu item
2. **Drag & Drop**: Support dragging .svg files onto canvas
3. **Clipboard**: Paste SVG content directly
4. **URL Import**: Import SVG from web URLs

### Implementation Steps

1. Vendor the `svg-to-excalidraw` library (already exists as separate package)
2. Add UI for file selection/upload
3. Add error handling and user feedback
4. Optional: Add import settings (scale, position, grouping)

---

## Other Valuable Features from Obsidian Plugin

### 1. **PDF Import** ✨

- **Files**: `InsertPDFModal.ts`, PDF handling utilities
- **What it does**: Imports PDFs as images (page by page)
- **Use case**: Technical diagrams, documentation references
- **Implementation**: Converts PDF pages to images, then inserts into canvas

### 2. **LaTeX Formula Support** ✨✨

- **Already implemented in your math branch!**
- Obsidian plugin uses a similar approach with MathJax
- Can insert formulas via command palette
- Edit formulas with CTRL+Click

### 3. **Image OCR (Text Extraction)**

- **Files**: OCR-related utilities
- **What it does**: Extract text from images on canvas
- **Use case**: Convert screenshots/photos with text into editable text
- **Tech**: Uses Tesseract.js or similar OCR engines

### 4. **Custom Color Palettes**

- **Configuration**: Template-based color palette customization
- **What it does**: Define custom color sets for stroke, fill, and background
- **Use case**: Branding, theme consistency, workflow optimization
- **Format**: JSON config in template file

### 5. **Auto-Export to PNG/SVG**

- **Files**: `ExportDialog.ts`, export utilities
- **What it does**: Automatically export drawings on save
- **Features**:
  - Keep in sync with source
  - Light/dark theme versions
  - Configurable export settings per file
  - Frontmatter-based export control

### 6. **Script Engine / Automation** ✨✨✨

- **Files**: `ExcalidrawAutomate.ts` (extensive API)
- **What it does**: JavaScript API for programmatic drawing manipulation
- **Features**:
  - Create/modify elements via script
  - Batch operations
  - Custom tools and workflows
  - Script library/marketplace
- **Use case**:
  - Diagramming automation
  - Data visualization
  - Custom shape generation
  - Workflow automation

### 7. **Fourth Font Support**

- **What it does**: Add custom fonts beyond the standard 3
- **Implementation**: Custom font loading and registration
- **Use case**: Branding, specialized typography

### 8. **Sticky Notes (Word Wrapping)**

- **What it does**: Auto-wrap text to fit container
- **Features**: Configurable wrap width, dynamic sizing
- **Use case**: Better note-taking experience

### 9. **Markdown Embeds**

- **What it does**: Embed Markdown content into drawings
- **Features**:
  - Live preview
  - Transclusion support
  - Block references
- **Use case**: Integration with knowledge bases

### 10. **Link Management**

- **Features**:
  - Automatic link updates when files move
  - Backlinks tracking
  - Block references
  - Quick preview on hover
- **Implementation**: Deep integration with Obsidian's link system

### 11. **Custom Pen Support**

- **Files**: `PenSettingsModal.ts`, pen-related types
- **What it does**: Configure tablet/stylus pen behavior
- **Features**:
  - Pressure sensitivity mapping
  - Tilt support
  - Custom pen tool configurations

### 12. **Image Anchoring**

- **What it does**: Pin images at 100% size
- **Use case**: Composite drawings from multiple files
- **Behavior**: Resets image size on reload/update

### 13. **Mobile Optimizations**

- Camera integration (iOS/Android)
- Touch gesture improvements
- Mobile-specific UI adjustments

---

## Priority Recommendations for Main Excalidraw

### High Priority ⭐⭐⭐

1. **SVG Import**

   - Widely requested feature
   - Existing library available
   - Enables workflow from other tools (Figma, Inkscape, etc.)
   - Relatively straightforward to implement

2. **Script/Automation API**

   - Powerful extensibility
   - Enables advanced use cases
   - Community-driven innovation
   - Consider as plugin system

3. **Custom Color Palettes**
   - Simple to implement
   - High user value
   - Improves workflow efficiency
   - Enables branding consistency

### Medium Priority ⭐⭐

4. **Auto-Export (PNG/SVG)**

   - Good for publishing workflows
   - Integration with CI/CD
   - Keep-in-sync functionality

5. **PDF Import**

   - Useful for technical documentation
   - Requires PDF parsing library
   - Large bundle size consideration

6. **OCR Support**
   - Innovative feature
   - Large bundle size (Tesseract.js ~2MB)
   - Could be optional plugin

### Lower Priority ⭐

7. **Fourth Font** - Nice to have
8. **Sticky Notes** - Could be regular text with word wrap
9. **Custom Pen** - Niche use case
10. **Markdown Embeds** - Obsidian-specific

---

## SVG Import Implementation Plan

### Phase 1: Core Integration

```bash
# 1. Add svg-to-excalidraw dependency
npm install @excalidraw/svg-to-excalidraw

# 2. Create import UI
# - Add "Import SVG" to File menu
# - Add file upload dialog

# 3. Implement import handler
# - Read SVG file
# - Convert to Excalidraw elements
# - Add to canvas at cursor/center
```

### Phase 2: Enhanced Features

- Drag & drop support for .svg files
- Clipboard paste support
- Import from URL
- Import settings (scale, position, grouping options)

### Phase 3: Advanced

- Preview before import
- Multi-file import
- Batch processing
- SVG optimization before import

---

## Code References

### SVG Import Example (from Obsidian plugin)

```typescript
// Reading and importing SVG
const svg = await readSVGFile(filePath);
const result = svgToExcalidraw(svg);

if (result.hasErrors) {
  showError(`Parsing errors: ${result.errors}`);
  return;
}

// Add elements to canvas
const elements = result.elements;
const groupId = createGroupId();
elements.forEach((el) => (el.groupIds = [groupId]));

// Add to view with options
addElementsToCanvas(elements, {
  autoZoom: true,
  autoSelect: true,
  animate: true,
});
```

### Available in Main Excalidraw Repo

Check if `svg-to-excalidraw` is already available:

```bash
cd /Users/frankliu/Work/excalidraw
npm search @excalidraw/svg-to-excalidraw
```

**Last Commit**: https://github.com/excalidraw/svg-to-excalidraw/commit/6f6e4b7269c4194b56cf7517a8357ba73be12a3a

---

## Next Steps

1. **Verify svg-to-excalidraw availability** in main repo
2. **Test SVG import** with sample files
3. **Design UI** for import feature
4. **Create feature branch** for SVG import
5. **Implement** basic import functionality
6. **Add tests** for various SVG formats
7. **Document** supported SVG features and limitations

---

## Resources

- **Obsidian Plugin**: `/Users/frankliu/Library/CloudStorage/Box-Box/Work/obsidian-excalidraw-plugin/`
- **SVG Library**: https://github.com/excalidraw/svg-to-excalidraw
- **Obsidian Plugin Docs**: https://excalidraw-obsidian.online/
- **Plugin README**: Extensive feature list with video tutorials
