# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ESM module support (`"type": "module"` in package.json)
- Branded types for type-safe unit handling (`Dots`, `Inches`, `Millimeters`, `Columns`, `Lines`)
- Factory functions for branded types (`dots()`, `inches()`, `mm()`, `columns()`, `lines()`)
- Type guards for layout nodes (`isStackNode`, `isFlexNode`, `isGridNode`, `isLineNode`)
- Exhaustive switch helper (`assertNever`)
- Custom error class hierarchy:
  - `EscpError` - Base error class
  - `ValidationError` - Parameter validation errors
  - `EscpRangeError` - Range validation errors
  - `GraphicsError` - Graphics operation errors
  - `EncodingError` - Text encoding errors
  - `ConfigurationError` - Configuration errors
- Validation utilities:
  - `assertByte()` - Validate 0-255 range
  - `assertRange()` - Validate arbitrary ranges
  - `assertUint16()` - Validate 16-bit values
  - `assertValidHex()` - Validate hex string format
  - `assertPositiveDimensions()` - Validate image dimensions
  - `assertNonNegative()` - Validate non-negative values
  - `assertOneOf()` - Validate value is in allowed list
- Shared utility functions (`bytes()`, `concat()`, `toLowHigh()`, `to32BitLE()`)
- Constants for limits, motion units, and pin counts
- TypeDoc API documentation generation (`pnpm docs`)
- Architecture documentation (`docs/ARCHITECTURE.md`)
- Example code:
  - Basic printing example
  - Layout system example
  - Graphics printing example
  - Barcode printing example
  - Virtual preview example
- Performance benchmarks (`pnpm bench`)
- Integration tests for full document pipeline
- Comprehensive tests for error classes and validation utilities

### Changed

- CommandBuilder now uses shared utilities from `core/utils.ts`
- LayoutEngine now uses shared utilities from `core/utils.ts`
- Updated exports in `index.ts` to include all new utilities

## [1.0.0] - 2024-XX-XX

### Added

- Initial release
- Complete ESC/P and ESC/P2 command generation
- Virtual DOM layout system with stack, flex, and grid layouts
- Fluent builder API for layout construction
- Three-phase layout algorithm (measure → layout → render)
- Graphics support with multiple dithering methods
- Barcode generation
- VirtualRenderer for print preview
- Character set handling and text encoding
- Printer state management
- Position tracking
- Support for EPSON LQ-2090II 24-pin dot matrix printer
