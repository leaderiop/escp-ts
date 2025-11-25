# escp-ts

A comprehensive TypeScript library for generating ESC/P and ESC/P2 printer commands for EPSON dot matrix printers (LQ-2090II and compatible).

## Features

- **ESC/P2 Command Generation**: Low-level command builder for direct printer control
- **Virtual Layout Engine**: High-level declarative system for building printer-friendly layouts (similar to CSS flexbox/grid)
- **Three Layout Components**:
  - **Stack**: Vertical or horizontal stacking of elements
  - **Flex**: Horizontal rows with flexible space distribution
  - **Grid**: Table-like layouts with fixed columns and rows
- **Rich Text Styling**: Bold, italic, underline, double-strike, double-width, double-height, condensed text
- **Font Management**: Multiple typefaces, CPI (Characters Per Inch) selection (10, 12, 15, 17, 20 CPI)
- **Graphics Support**: 24-pin and 8-pin bitmap graphics with multiple density modes
- **Dithering Algorithms**: None, threshold, ordered, Floyd-Steinberg, Atkinson
- **Barcode Printing**: Code 39, EAN-13, and other barcode types
- **Character Sets**: International character support with multiple code pages
- **Virtual Renderer**: In-memory bitmap preview of output before printing
- **Position Control**: Absolute and relative horizontal/vertical positioning

## Installation

```bash
npm install escp-ts
# or
pnpm add escp-ts
```

## Quick Start

### High-Level Layout Engine (Recommended)

```typescript
import { LayoutEngine, stack, flex, grid, text, line, PRINT_QUALITY } from 'escp-ts';

const engine = new LayoutEngine();

// Build a simple invoice layout
const invoice = stack()
  .padding(40)
  .gap(20)
  .add(
    flex()
      .justify('space-between')
      .text('ACME Corp', { bold: true, doubleWidth: true })
      .text('INVOICE', { bold: true })
  )
  .add(line('-', 'fill'))
  .add(
    grid([100, 'fill', 150])
      .columnGap(20)
      .cell('Qty', { bold: true })
      .cell('Item', { bold: true })
      .cell('Price', { bold: true })
      .headerRow()
      .cell('5').cell('Widget A').cell('$50.00').row()
      .cell('3').cell('Widget B').cell('$75.00').row()
  )
  .build();

// Render to printer commands
engine
  .initialize()
  .setQuality(PRINT_QUALITY.LQ)
  .render(invoice)
  .formFeed();

// Get output as Uint8Array
const output = engine.getOutput();

// Send to printer or save to file
```

### Low-Level Fluent API

```typescript
import { LayoutEngine, PRINT_QUALITY } from 'escp-ts';

const engine = new LayoutEngine();

engine
  .initialize()
  .setQuality(PRINT_QUALITY.LQ)
  .setBold(true)
  .printCentered('INVOICE')
  .setBold(false)
  .println('')
  .println('Customer: John Doe')
  .println('Date: 2024-01-15')
  .formFeed();

const output = engine.getOutput();
```

### Direct Command Builder (Lowest Level)

```typescript
import { CommandBuilder } from 'escp-ts';

const commands = [
  CommandBuilder.initialize(),
  CommandBuilder.boldOn(),
  ...CommandBuilder.printLine('Bold Text'),
  CommandBuilder.boldOff(),
  CommandBuilder.formFeed(),
];

// Concatenate all command arrays
const output = new Uint8Array(
  commands.reduce((acc, cmd) => [...acc, ...cmd], [] as number[])
);
```

## Layout System

The layout system uses a declarative approach similar to CSS flexbox and grid.

### Stack

Arranges children vertically (default) or horizontally:

```typescript
stack()
  .direction('vertical')  // or 'horizontal'
  .align('center')        // 'left', 'center', 'right'
  .gap(10)                // space between children
  .padding(20)            // uniform padding
  .padding({ top: 10, right: 20, bottom: 10, left: 20 })
  .text('Line 1')
  .text('Line 2')
  .build()
```

### Flex

Arranges children horizontally with flexible space distribution:

```typescript
flex()
  .justify('space-between')  // 'start', 'center', 'end', 'space-between', 'space-around'
  .alignItems('center')      // 'top', 'center', 'bottom'
  .gap(20)
  .text('Left')
  .text('Right')
  .build()
```

### Grid

Creates table-like layouts with columns and rows:

```typescript
grid([100, 'fill', 150])  // Column widths: fixed, flexible, fixed
  .columnGap(20)
  .rowGap(8)
  .cell('Header 1', { bold: true })
  .cell('Header 2', { bold: true })
  .cell('Header 3', { bold: true })
  .headerRow()
  .cell('Data 1').cell('Data 2').cell('Data 3').row()
  .cell('Data 4').cell('Data 5').cell('Data 6').row()
  .build()
```

Column width specifications:
- **Number**: Fixed width in dots (1/360 inch)
- **'auto'**: Size to content
- **'fill'**: Expand to fill available space

### Text Styling

```typescript
text('Styled text', {
  bold: true,
  italic: true,
  underline: true,
  doubleWidth: true,
  doubleHeight: true,
  condensed: true,
  cpi: 12,              // Characters per inch: 10, 12, 15, 17, 20
  align: 'center',      // 'left', 'center', 'right'
})
```

### Spacers and Lines

```typescript
// Vertical space
spacer(20)

// Horizontal line
line('-', 'fill')      // Fill available width
line('=', 500)         // Fixed width in dots
```

## Composable Components

Build reusable components as functions:

```typescript
const companyHeader = (name: string): FlexBuilder =>
  flex()
    .width('fill')
    .justify('space-between')
    .add(
      stack()
        .text(name, { bold: true, doubleWidth: true })
        .text('123 Business Street')
    )
    .add(
      stack()
        .align('right')
        .text('INVOICE', { bold: true })
        .text('Page 1 of 1')
    );

const itemsTable = (items: Item[]): StackBuilder => {
  const tableGrid = grid([60, 'fill', 100, 120])
    .columnGap(20)
    .cell('QTY', { bold: true })
    .cell('DESCRIPTION', { bold: true })
    .cell('PRICE', { bold: true })
    .cell('TOTAL', { bold: true })
    .headerRow();

  items.forEach(item => {
    tableGrid
      .cell(item.qty.toString())
      .cell(item.description)
      .cell(formatCurrency(item.price))
      .cell(formatCurrency(item.total))
      .row();
  });

  return stack()
    .add(line('=', 'fill'))
    .add(tableGrid)
    .add(line('=', 'fill'));
};

// Compose into final document
const invoice = stack()
  .padding(60)
  .add(companyHeader('ACME CORPORATION'))
  .add(itemsTable(items))
  .build();
```

## Graphics

### Print Images

```typescript
import { LayoutEngine, BIT_IMAGE_MODE } from 'escp-ts';

const image = {
  width: 200,
  height: 48,
  data: imagePixels  // Uint8Array of grayscale values
};

engine
  .initialize()
  .printImage(image, {
    mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN,
    dithering: 'floyd-steinberg'  // 'none', 'threshold', 'ordered', 'floyd-steinberg', 'atkinson'
  })
  .formFeed();
```

### Barcodes

```typescript
engine
  .initialize()
  .printBarcode('123456789012', {
    type: 0,           // EAN-13
    moduleWidth: 2,
    height: 80,
    hriPosition: 2,    // Human-readable text position
  })
  .formFeed();
```

## Preview Output

Generate PNG previews of your output using the VirtualRenderer:

```typescript
import { LayoutEngine, VirtualRenderer } from 'escp-ts';
import sharp from 'sharp';

const engine = new LayoutEngine();
engine.initialize().println('Test Document').formFeed();

const renderer = new VirtualRenderer({
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 90, bottom: 90, left: 90, right: 90 },
  linesPerPage: 66,
}, {
  scale: 1,
  showMargins: false,
});

renderer.render(engine.getOutput());
const pages = renderer.getPages();

// Convert to PNG
const page = pages[0];
await sharp(Buffer.from(page.data), {
  raw: { width: page.width, height: page.height, channels: 1 }
})
.png()
.toFile('preview.png');
```

## Paper Configuration

```typescript
import { LayoutEngine } from 'escp-ts';

const engine = new LayoutEngine({
  defaultPaper: {
    widthInches: 14.847,    // Custom paper width
    heightInches: 8.542,    // Custom paper height
    margins: {
      top: 90,              // In dots (1/360 inch)
      bottom: 90,
      left: 225,
      right: 225,
    },
    linesPerPage: 50,
  },
});
```

## Font Configuration

```typescript
import { LayoutEngine, PRINT_QUALITY, TYPEFACE } from 'escp-ts';

engine
  .setQuality(PRINT_QUALITY.LQ)      // DRAFT, LQ (Letter Quality)
  .setTypeface(TYPEFACE.ROMAN)       // ROMAN, SANS_SERIF, COURIER, etc.
  .setCpi(12)                        // 10, 12, 15, 17, 20
  .setCondensed(true)
  .setDoubleWidth(true)
  .setDoubleHeight(true);
```

## API Reference

### LayoutEngine

Main entry point for building documents.

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize printer and reset settings |
| `render(node)` | Render a layout node to commands |
| `print(text)` | Print text without line feed |
| `println(text)` | Print text with line feed |
| `printCentered(text)` | Print centered text |
| `printRightAligned(text)` | Print right-aligned text |
| `printImage(image, options)` | Print grayscale image |
| `printBarcode(data, options)` | Print barcode |
| `formFeed()` | Advance to next page |
| `finalize()` | Finalize document |
| `getOutput()` | Get ESC/P2 commands as Uint8Array |
| `toHex()` | Get output as hex string |
| `toBase64()` | Get output as base64 string |

### Builders

| Builder | Factory | Description |
|---------|---------|-------------|
| `StackBuilder` | `stack()` | Vertical/horizontal stacking |
| `FlexBuilder` | `flex()` | Flexible horizontal layout |
| `GridBuilder` | `grid(columns)` | Table layout |

### Node Factories

| Function | Description |
|----------|-------------|
| `text(content, options)` | Create text node |
| `spacer(size, flex)` | Create spacer node |
| `line(char, length)` | Create line node |

### Constants

```typescript
import {
  PRINT_QUALITY,      // DRAFT, LQ
  TYPEFACE,           // ROMAN, SANS_SERIF, COURIER, etc.
  JUSTIFICATION,      // LEFT, CENTER, RIGHT, FULL
  BIT_IMAGE_MODE,     // Various density modes
  INTERNATIONAL_CHARSET,
  CHAR_TABLE,
} from 'escp-ts';
```

## Examples

Run the included examples:

```bash
# Generate preview images
npx tsx src/preview.ts

# Check output/ directory for PNG files
```

## Unit System

The library uses dots as the primary unit (1/360 inch at 360 DPI):

- 360 dots = 1 inch
- 90 dots = 0.25 inch (default margin)
- At 10 CPI, each character is 36 dots wide

Conversion helpers:
```typescript
import { inchesToDots, dotsToInches, mmToDots } from 'escp-ts';

const dots = inchesToDots(1);    // 360
const inches = dotsToInches(360); // 1
const mm = mmToDots(25.4);       // 360
```

## Printer Compatibility

Tested with:
- EPSON LQ-2090II (24-pin)

Should work with other ESC/P2 compatible printers:
- EPSON LQ series
- EPSON FX series
- Other ESC/P2 compatible dot matrix printers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
