# escp-ts Examples

This package contains example code demonstrating all features of the escp-ts library for generating ESC/P2 printer commands.

## Quick Start

```bash
# Run a specific example
pnpm example:basic

# Run all examples
pnpm examples:all

# List all available examples
pnpm examples:list

# Run any example directly
npx tsx src/01-fundamentals/01-basic-printing.ts
```

## Directory Structure

```
src/
├── 01-fundamentals/     # Basic concepts (01-11)
├── 02-intermediate/     # Intermediate features (12-24)
├── 03-advanced/         # Advanced patterns (25-31)
├── components/          # Reusable component examples
├── qa/                  # QA/testing files (internal)
├── scripts/             # Helper scripts
├── _helpers.ts          # Shared utilities
└── index.ts             # Examples catalog
```

## Examples by Category

### 01 - Fundamentals (01-11)

| #   | Name            | Description                               |
| --- | --------------- | ----------------------------------------- |
| 01  | Basic Printing  | Text printing with styles, CPI, form feed |
| 02  | Layout System   | Stack and Flex layouts using JSX          |
| 03  | Graphics        | Image printing with dithering             |
| 04  | Barcodes        | Code 39, EAN-13, UPC-A, Code 128          |
| 05  | Virtual Preview | Virtual rendering and PNG export          |
| 06  | Text Styles     | Text styling with JSX components          |
| 07  | Pagination      | Multi-page documents                      |
| 08  | Constraints     | Width and height constraints              |
| 09  | Positioning     | Absolute and relative positioning         |
| 10  | Conditional     | Conditional rendering                     |
| 11  | Vertical Text   | Vertical text printing                    |

### 02 - Intermediate (12-24)

| #   | Name                    | Description                      |
| --- | ----------------------- | -------------------------------- |
| 12  | Margins                 | Margin and padding configuration |
| 13  | Percentages             | Percentage-based sizing          |
| 14  | Auto Margins            | Auto margins for centering       |
| 15  | Relative Positioning    | Relative position offsets        |
| 16  | Typefaces               | Different typeface options       |
| 17  | Print Quality           | Draft vs Letter Quality          |
| 18  | Line Spacing            | Line spacing configuration       |
| 19  | Superscript/Subscript   | Super and subscript text         |
| 20  | International Charsets  | International character sets     |
| 21  | Proportional Fonts      | Proportional font support        |
| 22  | Scalable Fonts          | Scalable font sizes              |
| 23  | Inter-Character Spacing | Character spacing adjustment     |
| 24  | Word Wrapping           | Word wrapping and overflow       |

### 03 - Advanced (25-31)

| #   | Name                   | Description                   |
| --- | ---------------------- | ----------------------------- |
| 25  | Graphics Modes         | Advanced graphics rendering   |
| 26  | Page Headers/Footers   | Repeating headers and footers |
| 27  | Template Interpolation | Data binding with templates   |
| 28  | Data Conditionals      | Data-driven conditionals      |
| 29  | List Iteration         | Iterating over data lists     |
| 30  | Reusable Components    | Component patterns            |
| 31  | Complete Invoice       | Full-featured invoice example |

### Components

The `src/components/` directory contains reusable component examples:

| #   | Name             | Description                 |
| --- | ---------------- | --------------------------- |
| 01  | Layout           | Stack, Flex, Spacer, Layout |
| 02  | Content          | Text, Line, Template        |
| 03  | Controls         | If, Switch, Case            |
| 04  | Data Display     | Table, List, Label          |
| 05  | Table Borders    | Table border styles         |
| 06  | Typography       | Heading, Caption, Badge     |
| 07  | Decorative       | Divider, Panel, Card        |
| 08  | Complete Invoice | Full invoice example        |

## Available Scripts

```bash
# Individual examples
pnpm example:basic      # 01-basic-printing
pnpm example:layout     # 02-layout-system
pnpm example:graphics   # 03-graphics
pnpm example:barcodes   # 04-barcodes
pnpm example:invoice    # 31-complete-invoice

# Batch operations
pnpm examples:all       # Run all examples
pnpm examples:list      # List all examples
pnpm qa:all             # Run all QA tests

# Direct execution
pnpm example -- src/01-fundamentals/07-pagination.ts
```

## Output Files

Examples generate output in the `output/` directory:

- `.prn` files - Raw ESC/P2 commands (sendable to printer)
- `.png` files - Virtual rendered preview images

## Sending to Printer

### Linux/macOS

```bash
# USB-connected printer
cat output/basic.prn > /dev/usb/lp0

# Network printer (via netcat)
cat output/basic.prn | nc printer.local 9100

# CUPS printer
lpr -P printer_name output/basic.prn
```

### Windows

```cmd
copy /b output\basic.prn LPT1:
```

## QA Tests

The `src/qa/` directory contains internal QA and stress tests organized by category:

- `flex/` - Flexbox layout tests
- `stack/` - Stack layout tests
- `positioning/` - Positioning tests
- `margins/` - Margin/padding tests
- `vertical/` - Vertical alignment tests
- `stress/` - Stress tests
- `byte-verification/` - ESC/P byte sequence verification
- `misc/` - Miscellaneous tests

Run all QA tests:

```bash
pnpm qa:all
```

## Dependencies

- `@escp/core` - Core ESC/P2 command generation
- `@escp/jsx` - JSX-based layout engine
- `@escp/preview` - Virtual renderer for PNG preview
- `sharp` - Image processing for PNG export
