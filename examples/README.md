# escp-ts Examples

This directory contains example code demonstrating the features of escp-ts.

## Running Examples

Create an output directory and run examples with `tsx`:

```bash
mkdir -p output
npx tsx examples/01-basic-printing.ts
```

## Examples

### 01-basic-printing.ts

Basic text printing demonstrating:
- Printer initialization
- Text styles (bold, italic, underline)
- Character density (CPI) settings
- Form feed

### 02-layout-system.ts

Layout system demonstrating:
- Stack layouts (vertical arrangement)
- Flex layouts (horizontal distribution)
- Grid layouts (tables)
- Nested layouts
- Complete invoice document

### 03-graphics.ts

Graphics printing demonstrating:
- Creating grayscale images
- Different dithering methods
- Built-in test patterns
- Custom image generation

### 04-barcodes.ts

Barcode generation demonstrating:
- Code 39 barcodes
- EAN-13 barcodes
- UPC-A barcodes
- Code 128 barcodes
- Barcode options (height, module width, HRI position)

### 05-virtual-preview.ts

Virtual rendering demonstrating:
- VirtualRenderer setup
- Rendering ESC/P2 to pixel buffer
- Page inspection
- PNG export (with sharp)

## Output Files

Examples save their output to the `output/` directory:
- `basic.prn` - Basic printing example
- `invoice.prn` - Layout system invoice
- `graphics.prn` - Graphics test page
- `barcodes.prn` - Barcode examples
- `preview-page-*.png` - Virtual preview pages

## Sending to Printer

On Linux/macOS, you can send `.prn` files directly to the printer:

```bash
# USB-connected printer
cat output/basic.prn > /dev/usb/lp0

# Network printer (via netcat)
cat output/basic.prn | nc printer.local 9100

# CUPS printer
lpr -P printer_name output/basic.prn
```

On Windows, use:

```cmd
copy /b output\basic.prn LPT1:
```
