# Excalidraw Fork Documentation

This directory contains comprehensive documentation for custom features and development workflows added to this Excalidraw fork.

## 📚 Documentation Structure

### 🧮 [MathJax Integration](./mathjax/)
Complete documentation for MathJax mathematical equation rendering support.

**Quick Start:**
- [QUICKSTART_MATH.md](./mathjax/QUICKSTART_MATH.md) - Get started with math rendering

**Core Documentation:**
- [MATHJAX_INTEGRATION_STATUS.md](./mathjax/MATHJAX_INTEGRATION_STATUS.md) - Integration status and overview
- [MATHJAX_PATCHES_SUMMARY.md](./mathjax/MATHJAX_PATCHES_SUMMARY.md) - Summary of all patches applied
- [MATH_SETUP.md](./mathjax/MATH_SETUP.md) - Setup guide for MathJax

**Implementation Details:**
- [CUSTOMDATA_USAGE_MATH.md](./mathjax/CUSTOMDATA_USAGE_MATH.md) - How customData is used for math elements
- [MATH_BACKWARD_COMPATIBILITY.md](./mathjax/MATH_BACKWARD_COMPATIBILITY.md) - Compatibility with existing elements

**Bug Fixes & Debugging:**
- [MATH_FONT_SIZE_FIX.md](./mathjax/MATH_FONT_SIZE_FIX.md) - Font size change fixes
- [MATH_ONLY_CONTROL_FIXED.md](./mathjax/MATH_ONLY_CONTROL_FIXED.md) - Math Only toggle control fix
- [MULTILINE_MATH_FIX.md](./mathjax/MULTILINE_MATH_FIX.md) - Multiline math rendering fix
- [MULTILINE_MATH_BUG_ANALYSIS.md](./mathjax/MULTILINE_MATH_BUG_ANALYSIS.md) - Bug analysis for multiline math
- [DEBUG_MATH_ONLY_CONTROL.md](./mathjax/DEBUG_MATH_ONLY_CONTROL.md) - Debugging guide for Math Only control

**Testing:**
- [MATH_ONLY_TEST.md](./mathjax/MATH_ONLY_TEST.md) - Testing instructions for Math Only mode
- [MULTILINE_DEBUG_INSTRUCTIONS.md](./mathjax/MULTILINE_DEBUG_INSTRUCTIONS.md) - Multiline math debugging

---

### 🎨 [SVG Import](./svg-import/)
Documentation for SVG file import functionality.

**Quick Start:**
- [QUICKSTART_SVG.md](./svg-import/QUICKSTART_SVG.md) - Get started with SVG imports

**Feature Documentation:**
- [SVG_IMPORT_FEATURE.md](./svg-import/SVG_IMPORT_FEATURE.md) - Feature overview and capabilities
- [SVG_IMPORT_SUMMARY.md](./svg-import/SVG_IMPORT_SUMMARY.md) - Implementation summary
- [SVG_IMPORT_INTEGRATION.md](./svg-import/SVG_IMPORT_INTEGRATION.md) - Integration details

---

### 🎯 [UI Improvements](./ui-improvements/)
User interface and file handling improvements.

**Feature Documentation:**
- [FILE_HANDLING_IMPROVEMENTS.md](./ui-improvements/FILE_HANDLING_IMPROVEMENTS.md) - File handle preservation and tab title updates
- [FILE_HANDLE_PERSISTENCE.md](./ui-improvements/FILE_HANDLE_PERSISTENCE.md) - 📋 Proposal: Persist file handles across page reloads
- [REFRESH_TEXT_BOUNDS.md](./ui-improvements/REFRESH_TEXT_BOUNDS.md) - Manual text bounding box refresh tool

---

### 🛠️ [Development](./development/)
Development environment setup and workflows.

**Setup Guides:**
- [DEV_SETUP.md](./development/DEV_SETUP.md) - Development environment setup
- [DEV_ENV_FIXES.md](./development/DEV_ENV_FIXES.md) - Common environment issues and fixes
- [PORT_CONFIGURATION.md](./development/PORT_CONFIGURATION.md) - Configure development server port
- [KEYBOARD_SHORTCUTS.md](./development/KEYBOARD_SHORTCUTS.md) - Keyboard shortcuts reference

**Git Workflow:**
- [FORK_AND_PUSH.md](./development/FORK_AND_PUSH.md) - Fork management and pushing changes

---

### 🔍 [Analysis](./analysis/)
Feature analysis and research documentation.

- [OBSIDIAN_FEATURES_ANALYSIS.md](./analysis/OBSIDIAN_FEATURES_ANALYSIS.md) - Analysis of Obsidian-related features
- [SESSION_STATE.md](./analysis/SESSION_STATE.md) - Session state management documentation

---

## 🚀 Quick Reference

### For New Contributors:
1. Start with [Development Setup](./development/DEV_SETUP.md)
2. Review [Fork and Push Workflow](./development/FORK_AND_PUSH.md)
3. Check [Environment Fixes](./development/DEV_ENV_FIXES.md) if you encounter issues

### To Use Math Features:
1. Read [Math Quick Start](./mathjax/QUICKSTART_MATH.md)
2. Check [Math Setup Guide](./mathjax/MATH_SETUP.md)
3. Review [Integration Status](./mathjax/MATHJAX_INTEGRATION_STATUS.md)

### To Use SVG Import:
1. Read [SVG Quick Start](./svg-import/QUICKSTART_SVG.md)
2. Review [SVG Feature Documentation](./svg-import/SVG_IMPORT_FEATURE.md)

### To Learn About Recent UI Improvements:
1. Review [File Handling Improvements](./ui-improvements/FILE_HANDLING_IMPROVEMENTS.md)

---

## 📊 Documentation Statistics

- **Total Documents**: 29 files
- **MathJax Documentation**: 13 files
- **SVG Import Documentation**: 4 files
- **UI Improvements Documentation**: 3 files
- **Development Guides**: 5 files
- **Analysis Documents**: 2 files

---

## 🤝 Contributing

When adding new documentation:
- Place files in the appropriate category folder
- Update this README with links to new documents
- Use clear, descriptive filenames
- Include proper markdown formatting

---

## 📝 Recent Changes

See git history for detailed changelog:
```bash
git log --oneline -- docs/
```

---

**Last Updated**: 2026-02-10
