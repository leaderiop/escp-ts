/**
 * Typography Components Example
 *
 * Demonstrates:
 * - Heading, Paragraph, Label, Caption, Code components
 * - Typeface selection (Roman, Sans Serif, Courier, Prestige, etc.)
 * - CPI options (10, 12, 15, 17, 20 characters per inch)
 * - Print quality (draft, lq)
 * - Style inheritance and direct props
 */

import { LayoutEngine } from '@escp/jsx';
import { Stack, Flex, Layout, Text, Line, Spacer } from '@escp/jsx';
import { Heading, Paragraph, Label, Caption, Code, Badge } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

// Typography example needs taller paper to show all 7 sections
const TALL_PAPER = {
  ...DEFAULT_PAPER,
  heightInches: 22, // ~22 inches to fit all content (was 8.5)
  linesPerPage: Math.floor(22 * 6), // ~132 lines at 6 LPI
};

async function main() {
  printSection('Typography Components');

  const engine = new LayoutEngine({ defaultPaper: TALL_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({ style: { bold: true, doubleWidth: true }, children: 'Typography Components' }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 1: TYPEFACE SHOWCASE
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '1. TYPEFACE SELECTION' }),
      Spacer({ style: { height: 10 } }),

      // Row 1: Typefaces (3 columns)
      Flex({
        style: { gap: 40 },
        children: [
          // Column 1: Standard Typefaces
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Standard Typefaces' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ style: { typeface: 'roman' }, children: 'Roman (default)' }),
                  Text({ style: { typeface: 'sans-serif' }, children: 'Sans Serif' }),
                  Text({ style: { typeface: 'courier' }, children: 'Courier (monospace)' }),
                  Text({ style: { typeface: 'prestige' }, children: 'Prestige' }),
                  Text({ style: { typeface: 'script' }, children: 'Script' }),
                ],
              }),
            ],
          }),

          // Column 2: Special Typefaces
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Special Typefaces' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ style: { typeface: 'orator' }, children: 'Orator' }),
                  Text({ style: { typeface: 'orator-s' }, children: 'Orator-S' }),
                  Text({ style: { typeface: 'roman-t' }, children: 'Roman-T' }),
                  Text({ style: { typeface: 'sans-serif-h' }, children: 'Sans Serif H' }),
                  Text({ style: { typeface: 'script-c' }, children: 'Script-C' }),
                ],
              }),
            ],
          }),

          // Column 3: OCR Typefaces
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'OCR Typefaces' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ style: { typeface: 'ocr-a' }, children: 'OCR-A (machine readable)' }),
                  Text({ style: { typeface: 'ocr-b' }, children: 'OCR-B (machine readable)' }),
                  Spacer({ style: { height: 10 } }),
                  Caption({ children: 'OCR fonts are for machine reading' }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 15 } }),

      // Typeface with components
      Text({ style: { bold: true }, children: 'Typeface on Components' }),
      Line({ char: '-', length: 'fill' }),
      Flex({
        style: { gap: 40 },
        children: [
          Stack({
            style: { width: '48%', gap: 5 },
            children: [
              Heading({ level: 3, typeface: 'sans-serif', children: 'Sans Serif Heading' }),
              Paragraph({ typeface: 'courier', children: 'Courier paragraph for code-like text.' }),
              Label({ label: 'Typeface', value: 'Prestige', typeface: 'prestige' }),
              Caption({ typeface: 'script', children: 'Script caption for elegant notes' }),
            ],
          }),
          Stack({
            style: { width: '48%', gap: 5 },
            children: [
              Text({ children: 'Code defaults to Courier:' }),
              Code({ children: 'const x = 42; // Courier font' }),
              Text({ children: 'Code with Roman override:' }),
              Code({ typeface: 'roman', children: 'const y = 100; // Roman font' }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 2: CPI (Characters Per Inch)
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '2. CPI (Characters Per Inch)' }),
      Spacer({ style: { height: 10 } }),

      Flex({
        style: { gap: 40 },
        children: [
          // Column 1: Standard CPI
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Standard CPI Values' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Text({ style: { cpi: 10 }, children: '10 CPI (Pica) - Standard' }),
                  Text({ style: { cpi: 12 }, children: '12 CPI (Elite) - More compact' }),
                  Text({ style: { cpi: 15 }, children: '15 CPI (Micron) - Even smaller' }),
                ],
              }),
            ],
          }),

          // Column 2: Condensed CPI
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Condensed CPI Values' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Text({
                    style: { cpi: 17, condensed: true },
                    children: '17 CPI (Pica + Condensed)',
                  }),
                  Text({
                    style: { cpi: 20, condensed: true },
                    children: '20 CPI (Elite + Condensed) - Most compact',
                  }),
                  Spacer({ style: { height: 5 } }),
                  Caption({ children: 'Note: Set condensed: true for 17/20 CPI' }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 10 } }),

      // CPI Comparison
      Text({ style: { bold: true }, children: 'CPI Comparison (same text)' }),
      Line({ char: '-', length: 'fill' }),
      Stack({
        style: { padding: { top: 5 }, gap: 5 },
        children: [
          Text({ style: { cpi: 10 }, children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ (10 CPI)' }),
          Text({ style: { cpi: 12 }, children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ (12 CPI)' }),
          Text({ style: { cpi: 15 }, children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ (15 CPI)' }),
          Text({
            style: { cpi: 17, condensed: true },
            children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ (17 CPI)',
          }),
          Text({
            style: { cpi: 20, condensed: true },
            children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ (20 CPI)',
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 3: PRINT QUALITY
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '3. PRINT QUALITY' }),
      Spacer({ style: { height: 10 } }),

      Flex({
        style: { gap: 40 },
        children: [
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Letter Quality (LQ)' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5, printQuality: 'lq' },
                children: [
                  Text({ children: 'High quality output (121 cps)' }),
                  Text({ children: 'Best for final documents' }),
                  Text({ style: { bold: true }, children: 'Bold text in LQ mode' }),
                ],
              }),
            ],
          }),
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Draft Quality' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5, printQuality: 'draft' },
                children: [
                  Text({ children: 'Fast output (584 cps)' }),
                  Text({ children: 'Good for proofs and drafts' }),
                  Text({ style: { bold: true }, children: 'Bold text in draft mode' }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 4: HEADING LEVELS
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '4. HEADING LEVELS & STYLES' }),
      Spacer({ style: { height: 10 } }),

      Flex({
        style: { gap: 40 },
        children: [
          // Column 1: Heading Levels
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Heading Levels' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Heading({ level: 1, children: 'H1 Heading' }),
                  Heading({ level: 2, children: 'H2 Heading' }),
                  Heading({ level: 3, children: 'H3 Heading' }),
                  Heading({ level: 4, children: 'H4 Heading' }),
                ],
              }),
            ],
          }),

          // Column 2: Heading with Underline
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Heading Underlines' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 8 },
                children: [
                  Heading({ level: 1, underline: true, children: 'H1 Underlined' }),
                  Heading({ level: 2, underline: true, children: 'H2 Underlined' }),
                  Heading({ level: 3, underline: '*', children: 'H3 Custom *' }),
                ],
              }),
            ],
          }),

          // Column 3: Heading Alignment
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Heading Alignment' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Heading({ level: 4, align: 'left', children: 'Left Aligned' }),
                  Heading({ level: 4, align: 'center', children: 'Center' }),
                  Heading({ level: 4, align: 'right', children: 'Right' }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 5: LABEL, CAPTION, PARAGRAPH
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '5. LABEL, CAPTION & PARAGRAPH' }),
      Spacer({ style: { height: 10 } }),

      Flex({
        style: { gap: 40 },
        children: [
          // Label Component
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Label Component' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Label({ label: 'Name', value: 'John Doe' }),
                  Label({ label: 'Email', value: 'john@example.com' }),
                  Label({ label: 'Phone', value: '+1 (555) 123-4567' }),
                  Label({
                    label: 'Status',
                    children: Badge({ variant: 'success', children: 'ACTIVE' }),
                  }),
                  Line({ char: '-', length: 'fill' }),
                  Label({ label: 'No colon', value: 'Custom', colon: false }),
                  Label({ label: 'Wide Label', value: '200px', labelWidth: 200 }),
                  Label({ label: 'Courier', value: 'Monospace', typeface: 'courier' }),
                ],
              }),
            ],
          }),

          // Caption & Paragraph
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Caption & Paragraph' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 5 },
                children: [
                  Text({ children: 'Main content here' }),
                  Caption({ children: 'Caption - italic text for descriptions' }),
                  Caption({ align: 'right', children: 'Right-aligned caption' }),
                  Caption({ typeface: 'sans-serif', children: 'Sans Serif caption' }),
                  Line({ char: '-', length: 'fill' }),
                  Paragraph({
                    children: 'Paragraphs have automatic margins above and below.',
                  }),
                  Paragraph({
                    indent: 50,
                    children: 'This paragraph has an indent at the start.',
                  }),
                  Paragraph({
                    typeface: 'courier',
                    children: 'Courier paragraph for technical content.',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 6: CODE COMPONENT
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '6. CODE COMPONENT' }),
      Spacer({ style: { height: 10 } }),

      Flex({
        style: { gap: 40 },
        children: [
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Code Blocks' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Text({ children: 'Default (Courier + border):' }),
                  Code({ children: 'const sum = arr.reduce((a, b) => a + b);' }),
                  Text({ children: 'Without border:' }),
                  Code({ border: false, children: 'npm install escp-ts' }),
                ],
              }),
            ],
          }),
          Stack({
            style: { width: '48%' },
            children: [
              Text({ style: { bold: true }, children: 'Inline & Custom Typeface' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { padding: { top: 5 }, gap: 10 },
                children: [
                  Flex({
                    children: [
                      Text({ children: 'Use ' }),
                      Code({ inline: true, children: 'console.log()' }),
                      Text({ children: ' for debugging' }),
                    ],
                  }),
                  Text({ children: 'Code with Roman typeface:' }),
                  Code({ typeface: 'roman', children: 'function hello() {}' }),
                  Text({ children: 'Code with Sans Serif:' }),
                  Code({ typeface: 'sans-serif', children: 'class MyComponent {}' }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 15 } }),

      // ============================================================
      // SECTION 7: COMBINED STYLES
      // ============================================================
      Text({ style: { bold: true, underline: true }, children: '7. COMBINED STYLES' }),
      Spacer({ style: { height: 10 } }),

      Text({ style: { bold: true }, children: 'Typeface + CPI + Style Combinations' }),
      Line({ char: '-', length: 'fill' }),
      Stack({
        style: { padding: { top: 5 }, gap: 5 },
        children: [
          Text({
            style: { typeface: 'courier', cpi: 12, bold: true },
            children: 'Courier 12 CPI Bold',
          }),
          Text({
            style: { typeface: 'sans-serif', cpi: 10, italic: true },
            children: 'Sans Serif 10 CPI Italic',
          }),
          Text({
            style: { typeface: 'roman', cpi: 15, underline: true },
            children: 'Roman 15 CPI Underlined',
          }),
          Text({
            style: { typeface: 'prestige', cpi: 17, condensed: true, bold: true },
            children: 'Prestige 17 CPI Condensed Bold',
          }),
          Text({
            style: { typeface: 'courier', cpi: 20, condensed: true, doubleStrike: true },
            children: 'Courier 20 CPI Condensed Double-Strike',
          }),
        ],
      }),

      Spacer({ style: { height: 10 } }),

      Text({ style: { bold: true }, children: 'Style Inheritance' }),
      Line({ char: '-', length: 'fill' }),
      Stack({
        style: { padding: { top: 5 }, typeface: 'sans-serif', cpi: 12 },
        children: [
          Text({ children: 'Parent: Sans Serif 12 CPI' }),
          Stack({
            style: { padding: { left: 20 }, gap: 3 },
            children: [
              Text({ children: 'Child inherits Sans Serif 12 CPI' }),
              Text({ style: { typeface: 'courier' }, children: 'Child overrides to Courier' }),
              Text({ style: { cpi: 10 }, children: 'Child overrides to 10 CPI' }),
              Text({ style: { bold: true }, children: 'Child adds bold (inherits font)' }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 10 } }),
      Line({ char: '=', length: 'fill' }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, 'Typography Components', 'components-05-typography', {
    paper: TALL_PAPER,
  });
}

main().catch(console.error);
