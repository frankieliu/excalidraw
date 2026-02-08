# Excalidraw Math Subtype Documentation

This directory contains documentation for the MathJax integration and math subtype implementation in Excalidraw.

## Architecture & Implementation

### [CUSTOMDATA_USAGE_MATH.md](./CUSTOMDATA_USAGE_MATH.md)
Comprehensive explanation of how `customData` is used in the math subtype to store rendering preferences (`useTex`, `mathOnly`). Covers:
- Type definitions
- Element-level vs AppState-level storage
- Lifecycle from creation to rendering
- User actions that modify customData
- Backward compatibility

### [MATHJAX_PATCHES_SUMMARY.md](./MATHJAX_PATCHES_SUMMARY.md)
Summary of browser-specific patches applied to MathJax 3.2.2 for optimal rendering in Excalidraw.

### [MATHJAX_INTEGRATION_STATUS.md](./MATHJAX_INTEGRATION_STATUS.md)
Current status of the MathJax integration, including completed features and known limitations.

## Bug Fixes & Solutions

### [MATH_FONT_SIZE_FIX.md](./MATH_FONT_SIZE_FIX.md)
Documentation of the font size synchronization fix between text editing and math rendering modes.

### [MULTILINE_MATH_FIX.md](./MULTILINE_MATH_FIX.md)
Fix for multiline math rendering issue where newlines were incorrectly replaced with spaces.

### [MULTILINE_MATH_BUG_ANALYSIS.md](./MULTILINE_MATH_BUG_ANALYSIS.md)
Detailed analysis of the multiline math bug, including the problematic logic in `consumeMathNewlines`.

## Compatibility

### [MATH_BACKWARD_COMPATIBILITY.md](./MATH_BACKWARD_COMPATIBILITY.md)
How math elements saved with the math subtype are handled when opened in vanilla Excalidraw (without math support). Covers:
- Element structure differences
- What happens in vanilla Excalidraw
- Round-trip compatibility
- Edge cases

## Development Files (Root Directory)

The following files remain in the root directory for development setup:

- **MATH_SETUP.md** - Instructions for setting up MathJax in development
- **DEV_SETUP.md** - General development environment setup
- **DEV_ENV_FIXES.md** - Common development environment issues and fixes
- **FORK_AND_PUSH.md** - Instructions for forking and pushing to your own repository
- **CLAUDE.md** - Project structure and development workflow guide

## Quick Start

1. Read [MATHJAX_INTEGRATION_STATUS.md](./MATHJAX_INTEGRATION_STATUS.md) for current status
2. Read [CUSTOMDATA_USAGE_MATH.md](./CUSTOMDATA_USAGE_MATH.md) to understand the architecture
3. Check specific bug fix docs if working on related issues

## Contributing

When adding new documentation:
- Place implementation/architecture docs in this `docs/` directory
- Place setup/development workflow docs in the root directory
- Update this README with a link and brief description
