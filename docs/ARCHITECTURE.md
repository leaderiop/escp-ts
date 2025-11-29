# escp-ts Architecture

This document describes the internal architecture of the escp-ts library, a TypeScript implementation of the ESC/P and ESC/P2 printer control language optimized for the EPSON LQ-2090II 24-pin dot matrix printer.

## Overview

The library is organized into several layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (LayoutEngine, VirtualRenderer, High-level API)        │
├─────────────────────────────────────────────────────────┤
│                     Layout System                        │
│  (Measure → Layout → Render pipeline)                   │
├─────────────────────────────────────────────────────────┤
│                   Command Generation                     │
│  (CommandBuilder, Graphics Conversion)                  │
├─────────────────────────────────────────────────────────┤
│                      Core Layer                          │
│  (Types, Constants, State, Validation, Errors)          │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── core/               # Core types, constants, and utilities
│   ├── types.ts       # TypeScript type definitions
│   ├── constants.ts   # ESC/P2 command constants
│   ├── utils.ts       # Shared utility functions
│   ├── errors.ts      # Custom error classes
│   ├── validation.ts  # Input validation utilities
│   └── PrinterState.ts # Printer state management
│
├── commands/          # ESC/P2 command generation
│   └── CommandBuilder.ts
│
├── fonts/             # Character set and font handling
│   └── CharacterSet.ts
│
├── graphics/          # Bitmap conversion for graphics
│   └── BitmapConverter.ts
│
├── layout/            # Virtual DOM layout system
│   ├── nodes.ts       # Node type definitions
│   ├── builders.ts    # Fluent builder API
│   ├── measure.ts     # Measure phase
│   ├── layout.ts      # Layout phase
│   ├── renderer.ts    # Render phase
│   └── LayoutEngine.ts
│
├── renderer/          # Output rendering
│   └── VirtualRenderer.ts
│
└── index.ts           # Public API exports
```

## Core Layer

### Types (`core/types.ts`)

Defines branded types for type-safe unit handling:

```typescript
type Dots = Brand<number, 'dots'>; // 1/360 inch
type Inches = Brand<number, 'inches'>;
type Millimeters = Brand<number, 'mm'>;
type Columns = Brand<number, 'columns'>;
type Lines = Brand<number, 'lines'>;
```

### Constants (`core/constants.ts`)

Contains all ESC/P2 command codes and printer specifications:

- `ASCII` - ASCII control codes (ESC, LF, CR, FF, etc.)
- `ESC_COMMANDS` - ESC command codes
- `TYPEFACE` - Available typeface constants
- `PRINT_QUALITY` - Draft/LQ mode settings
- `PAPER_SIZE` - Standard paper dimensions
- `LIMITS` - Protocol limits (max bytes, etc.)

### Printer State (`core/PrinterState.ts`)

Manages printer state including:

- Current position (x, y in dots)
- Font configuration (CPI, typeface, style)
- Page configuration (margins, paper size)
- Line spacing settings

### Validation (`core/validation.ts`)

Input validation functions that throw typed errors:

- `assertByte()` - Validate 0-255 range
- `assertRange()` - Validate arbitrary ranges
- `assertUint16()` - Validate 16-bit values
- `assertValidHex()` - Validate hex string format
- `assertPositiveDimensions()` - Validate image dimensions

### Error Handling (`core/errors.ts`)

Custom error class hierarchy:

```
EscpError (base)
├── ValidationError
│   └── EscpRangeError
├── GraphicsError
├── EncodingError
└── ConfigurationError
```

## Command Generation

### CommandBuilder (`commands/CommandBuilder.ts`)

Static methods for generating ESC/P2 command sequences:

```typescript
CommandBuilder.initialize(); // ESC @
CommandBuilder.boldOn(); // ESC E
CommandBuilder.boldOff(); // ESC F
CommandBuilder.setLineSpacing(); // ESC 3 n
CommandBuilder.setPosition(); // ESC $ nL nH
CommandBuilder.printImage(); // ESC * mode...
```

All methods return `Uint8Array` for efficient binary handling.

## Layout System

The layout system uses a three-phase approach inspired by browser rendering:

### 1. Virtual DOM Nodes (`layout/nodes.ts`)

Declarative node types:

- **Container nodes**: `StackNode`, `FlexNode`, `GridNode`
- **Leaf nodes**: `TextNode`, `SpacerNode`, `LineNode`

Each node can have:

- Width/height specifications (`number | 'auto' | 'fill'`)
- Padding
- Style properties (bold, italic, underline, etc.)

### 2. Builder API (`layout/builders.ts`)

Fluent API for constructing layouts:

```typescript
const layout = stack()
  .gap(20)
  .text('Header', { bold: true })
  .child(flex().justify('space-between').text('Left').text('Right').build())
  .build();
```

### 3. Measure Phase (`layout/measure.ts`)

Calculates intrinsic sizes:

```typescript
interface MeasuredNode {
  node: LayoutNode;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  children: MeasuredNode[];
}
```

### 4. Layout Phase (`layout/layout.ts`)

Assigns final positions and dimensions:

```typescript
interface LayoutResult {
  node: LayoutNode;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutResult[];
}
```

### 5. Render Phase (`layout/renderer.ts`)

Flattens the tree and generates render commands:

```typescript
interface RenderItem {
  type: 'text' | 'line' | 'spacer';
  x: number;
  y: number;
  // ... type-specific properties
}
```

## Graphics Pipeline

### BitmapConverter (`graphics/BitmapConverter.ts`)

Converts grayscale images to printer format:

1. **Input**: `GrayscaleImage { width, height, data: Uint8Array }`
2. **Dithering**: Floyd-Steinberg, ordered, threshold, or none
3. **Column conversion**: 24-pin or 8-pin format
4. **Stripe splitting**: Handles tall images by splitting into bands

## High-Level API

### LayoutEngine (`layout/LayoutEngine.ts`)

Main entry point combining all functionality:

```typescript
const engine = new LayoutEngine();

engine
  .initialize()
  .setQuality(PRINT_QUALITY.LQ)
  .setBold(true)
  .println('Hello, World!')
  .render(layout)
  .formFeed();

const output = engine.getOutput();
```

### VirtualRenderer (`renderer/VirtualRenderer.ts`)

Renders ESC/P2 commands to virtual pages for preview:

```typescript
const renderer = new VirtualRenderer({ dpi: 180 });
renderer.render(escpData);
const pages = renderer.getPages();
// pages[0].data is ImageData-compatible
```

## Data Flow

```
User Code
    │
    ▼
LayoutEngine.render(layout)
    │
    ├─── measureNode()  ──► MeasuredNode tree
    │
    ├─── layoutNode()   ──► LayoutResult tree
    │
    ├─── renderLayout() ──► RenderItem[]
    │
    └─── CommandBuilder ──► Uint8Array (ESC/P2 bytes)
```

## Thread Safety

The library is designed for single-threaded use. Each `LayoutEngine` instance maintains its own state and output buffer.

## Memory Considerations

- Output buffers grow dynamically using `Uint8Array`
- Large images are processed in stripes to limit memory
- Virtual renderer pages are allocated per-page

## Extension Points

1. **Custom typefaces**: Add entries to `CharacterSet.PROPORTIONAL_WIDTHS`
2. **New layout nodes**: Extend `LayoutNode` union type
3. **Custom dithering**: Add methods to `BitmapConverter`
4. **Printer profiles**: Create new profile objects like `LQ_2090II_PROFILE`
